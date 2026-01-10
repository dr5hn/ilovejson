import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
const convert = require('xml-js');

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontoxml';
const downloadDir = globals.downloadDir + '/jsontoxml';

export const config = {
  api: {
    bodyParser: false,
  },
};

const xmlOptions = {
  compact: true, // BUGGY
  ignoreComment: false,
  spaces: 2
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
  const jsonData = JSON.parse(jsonRead);

  // Prepare data structure for XML conversion
  let dataToConvert;
  if (Array.isArray(jsonData)) {
    // For arrays, create root with multiple item elements
    dataToConvert = { root: { item: jsonData } };
  } else {
    // For single object, wrap in root with single item
    dataToConvert = { root: { item: [jsonData] } };
  }

  let xmlOp = convert.json2xml(JSON.stringify(dataToConvert), xmlOptions);

  // Add XML declaration
  xmlOp = '<?xml version="1.0" encoding="UTF-8"?>\n\n' + xmlOp;

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.xml`;
  fs.writeFileSync(outputFilePath, xmlOp, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to XML Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
