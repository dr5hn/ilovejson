import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { json2csv } from 'json-2-csv';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontocsv';
const downloadDir = globals.downloadDir + '/jsontocsv';

export const config = {
  api: {
    bodyParser: false,
  },
};

const options = {
  excelBOM: true,
  expandArrayObjects: false, // Should objects in array values be deep-converted to CSV?
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
  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead); // Error handler will catch invalid JSON

  const csv = json2csv(jsonData, options);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.csv`;
  fs.writeFileSync(outputFilePath, csv, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to CSV Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
