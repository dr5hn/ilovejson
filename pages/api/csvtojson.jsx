import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { csv2json } from 'json-2-csv';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/csvtojson';
const downloadDir = globals.downloadDir + '/csvtojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

const options = {
  excelBOM: true,
  trimHeaderFields: true,
  trimFieldValues: true,
};

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic
  const csvRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const json = csv2json(csvRead, options);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, JSON.stringify(json, undefined, 4), 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. CSV to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
