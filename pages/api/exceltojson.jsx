import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import * as XLSX from 'xlsx'; // ✅ consistent ES module import
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
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  // Handle invalid or corrupted Excel files gracefully
  let workbook;
  try {
    const fileBuffer = fs.readFileSync(req.uploadedFile.path);
    workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellFormula: false,
      cellDates: true,
      dateNF: 'yyyy-mm-dd',
    });
  } catch (err) {
    return ReE(res, 'Failed to read Excel file. Please upload a valid .xlsx, .xls, or .csv file.', 422);
  }

  // ✅ Fix fields lookup — check req.body/req.fields, not req.uploadedFile.fields
  const sheetName = req.body?.sheetName || req.fields?.sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return ReE(res, `Sheet "${sheetName}" not found in Excel file.`, 422);
  }

  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
  });

  if (rawData.length === 0) {
    return ReE(res, 'No data found in the Excel sheet.', 422);
  }

  const headers = Object.keys(rawData[0]);
  const jsonData = rawData.filter((row) => !isSummaryRow(row, headers));

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
