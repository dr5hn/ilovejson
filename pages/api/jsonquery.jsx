import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import jmespath from 'jmespath';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsonquery';
const downloadDir = globals.downloadDir + '/jsonquery';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  // Run middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 50, windowMs: 60000 }), // Higher limit for query tool
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Get query from form fields
  const query = req.body?.query || '';

  if (!query || query.trim() === '') {
    return ReE(res, 'Query is required', 400);
  }

  try {
    // Read and parse JSON file
    const jsonContent = fs.readFileSync(req.uploadedFile.path, 'utf8');
    const jsonData = JSON.parse(jsonContent);

    // Execute JMESPath query
    const result = jmespath.search(jsonData, query);

    // Save result if user wants to download
    const modifiedDate = new Date().getTime();
    const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
    fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf8');

    // Cleanup uploaded file
    fs.unlinkSync(req.uploadedFile.path);

    const toPath = outputFilePath.replace('public/', '');

    return ReS(res, {
      message: 'Query executed successfully.',
      data: `/${toPath}`,
      result: result,
      query: query,
    });
  } catch (error) {
    // Cleanup file on error
    try {
      if (req.uploadedFile?.path) fs.unlinkSync(req.uploadedFile.path);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    if (error.name === 'ParserError' || error.name === 'LexerError') {
      return ReE(res, `Invalid JMESPath query: ${error.message}`, 400);
    }

    throw error;
  }
}

export default errorHandler(handler);
