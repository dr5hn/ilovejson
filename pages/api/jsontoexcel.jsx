import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import * as XLSX from 'xlsx';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontoexcel';
const downloadDir = globals.downloadDir + '/jsontoexcel';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  let jsonData = JSON.parse(jsonRead);

  if (!Array.isArray(jsonData)) {
    jsonData = [jsonData];
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(jsonData);

  const sheetName = req.uploadedFile.fields?.sheetName || 'Sheet1';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.xlsx`;

  XLSX.writeFile(workbook, outputFilePath);

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to Excel Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
