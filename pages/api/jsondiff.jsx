import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { diff } from 'deep-diff';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { errorHandler } from '@middleware/errorHandler';
import formidable from 'formidable';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsondiff';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  // Run middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
  ]);

  // Parse two files
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 104857600, // 100MB
    multiples: true,
  });

  const [fields, files] = await form.parse(req);

  // Get the two files
  const file1Array = files.file1 || [];
  const file2Array = files.file2 || [];

  if (file1Array.length === 0 || file2Array.length === 0) {
    return ReE(res, 'Both files are required for comparison', 400);
  }

  const file1 = file1Array[0];
  const file2 = file2Array[0];

  try {
    // Read and parse both JSON files
    const json1Content = fs.readFileSync(file1.filepath, 'utf8');
    const json2Content = fs.readFileSync(file2.filepath, 'utf8');

    const json1 = JSON.parse(json1Content);
    const json2 = JSON.parse(json2Content);

    // Calculate differences
    const differences = diff(json1, json2) || [];

    // Calculate summary
    const summary = {
      added: differences.filter(d => d.kind === 'N').length,
      removed: differences.filter(d => d.kind === 'D').length,
      modified: differences.filter(d => d.kind === 'E').length,
      arrayChanged: differences.filter(d => d.kind === 'A').length,
      total: differences.length,
      identical: differences.length === 0,
    };

    // Cleanup uploaded files
    fs.unlinkSync(file1.filepath);
    fs.unlinkSync(file2.filepath);

    return ReS(res, {
      message: summary.identical
        ? 'Files are identical.'
        : `Found ${summary.total} difference(s).`,
      summary,
      differences,
    });
  } catch (error) {
    // Cleanup files on error
    try {
      if (file1?.filepath) fs.unlinkSync(file1.filepath);
      if (file2?.filepath) fs.unlinkSync(file2.filepath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export default errorHandler(handler);
