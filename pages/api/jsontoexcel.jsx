import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import ExcelJS from 'exceljs';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
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
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsontoexcel').maxFileSize }),
  ]);

  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  let jsonData = JSON.parse(jsonRead);

  if (!Array.isArray(jsonData)) {
    jsonData = [jsonData];
  }

  // Pre-serialize nested objects — prevents [object Object] in cells
  const flatData = jsonData.map(row => {
    const flat = {};
    for (const [key, val] of Object.entries(row)) {
      flat[key] = typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
    }
    return flat;
  });

  const workbook = new ExcelJS.Workbook();

  // Read sheetName from formidable-parsed fields (req.body is undefined when bodyParser: false)
  const sheetField = req.uploadedFile?.fields?.sheetName;
  const rawSheet = (Array.isArray(sheetField) ? sheetField[0] : sheetField) || 'Sheet1';
  const sheetName = rawSheet.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 31) || 'Sheet1';

  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns from the keys of the first row
  const headers = Object.keys(flatData[0] || {});
  worksheet.columns = headers.map(key => ({ header: key, key }));

  // Add data rows
  flatData.forEach(row => worksheet.addRow(row));

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.xlsx`;
  await workbook.xlsx.writeFile(outputFilePath);

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to Excel Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
