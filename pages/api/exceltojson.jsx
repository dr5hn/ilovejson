import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import * as XLSX from 'xlsx';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/exceltojson';
const downloadDir = globals.downloadDir + '/exceltojson';

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

  const workbook = XLSX.readFile(req.uploadedFile.path);

  const sheetName =
    req.uploadedFile.fields?.sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return ReE(res, `Sheet "${sheetName}" not found in Excel file.`, 422);
  }

  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  const jsonOutput = JSON.stringify(jsonData, null, 2);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. Excel to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
