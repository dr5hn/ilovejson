import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import ExcelJS from 'exceljs';
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

const uploadDir = globals.uploadDir + '/exceltojson';
const downloadDir = globals.downloadDir + '/exceltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Filter out summary/total rows where most fields are null/empty
function isSummaryRow(row, headers) {
  const nullCount = headers.filter(
    (h) => row[h] === null || row[h] === undefined || row[h] === ''
  ).length;
  return nullCount > headers.length / 2;
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('exceltojson').maxFileSize, tieredBatch: true }),
  ]);

  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  // Handle invalid or corrupted Excel files gracefully
  let workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.uploadedFile.path);
  } catch (err) {
    return ReE(res, 'Failed to read Excel file. Please upload a valid .xlsx file.', 422);
  }

  // Read sheetName from formidable-parsed fields (req.body is undefined when bodyParser: false)
  const sheetField = req.uploadedFile?.fields?.sheetName;
  const requestedSheet = (Array.isArray(sheetField) ? sheetField[0] : sheetField);
  const worksheet = requestedSheet
    ? workbook.getWorksheet(requestedSheet)
    : workbook.worksheets[0];

  if (!worksheet) {
    return ReE(res, `Sheet "${requestedSheet}" not found in Excel file.`, 422);
  }

  // Convert worksheet rows to JSON objects using the header row as keys
  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values; // row.values is 1-indexed, index 0 is undefined
    if (rowNumber === 1) {
      headers = values.slice(1).map(v => (v != null ? String(v) : ''));
      return;
    }
    const obj = {};
    headers.forEach((header, i) => {
      const val = values[i + 1];
      obj[header] = val !== undefined ? val : null;
    });
    rows.push(obj);
  });

  if (rows.length === 0) {
    return ReE(res, 'No data found in the Excel sheet.', 422);
  }

  const jsonData = rows.filter((row) => !isSummaryRow(row, headers));

  if (jsonData.length === 0) {
    return ReE(res, 'No valid data rows found after filtering summary rows.', 422);
  }

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
