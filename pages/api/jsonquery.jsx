import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import jmespath from 'jmespath';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { toolsLimit } from '@middleware/toolsLimit';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
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
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsonquery').maxFileSize, tieredBatch: true }), // 100MB
  ]);

  // Get query from formidable-parsed fields (req.body is undefined when bodyParser: false)
  const queryField = req.uploadedFile?.fields?.query;
  const query = (Array.isArray(queryField) ? queryField[0] : queryField) || '';

  if (!query || query.trim() === '') {
    return ReE(res, 'Query is required', 400);
  }

  try {
    // Read and parse JSON file
    const jsonContent = fs.readFileSync(req.uploadedFile.path, 'utf8');
    const jsonData = JSON.parse(jsonContent);

    // Execute JMESPath query
    const result = jmespath.search(jsonData, query);

    // Normalize undefined to null so JSON.stringify produces valid output
    const safeResult = result === undefined ? null : result;

    // Save result if user wants to download
    const modifiedDate = new Date().getTime();
    const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
    fs.writeFileSync(outputFilePath, JSON.stringify(safeResult, null, 2), 'utf8');

    // Cleanup uploaded file
    fs.unlinkSync(req.uploadedFile.path);

    const toPath = outputFilePath.replace('public/', '');

    return ReS(res, {
      message: 'Query executed successfully.',
      data: `/${toPath}`,
      result: safeResult,
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
