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
  compact: false,
  spaces: 2,
};

function buildValue(val) {
  if (Array.isArray(val)) {
    return val.map(item =>
      typeof item === 'object' && item !== null
        ? { type: 'element', name: 'item', elements: buildChildren(item) }
        : { type: 'element', name: 'item', elements: [{ type: 'text', text: String(item) }] }
    );
  }
  if (typeof val === 'object' && val !== null) {
    return buildChildren(val);
  }
  return [{ type: 'text', text: String(val) }];
}

function buildChildren(obj) {
  return Object.entries(obj).map(([key, val]) => ({
    type: 'element',
    name: key,
    elements: buildValue(val),
  }));
}

function buildElements(jsonData) {
  const items = Array.isArray(jsonData) ? jsonData : [jsonData];
  return {
    elements: [
      {
        type: 'element',
        name: 'root',
        elements: items.map(item => ({
          type: 'element',
          name: 'item',
          elements: buildChildren(item), // ✅ uses recursive helper
        })),
      },
    ],
  };
}

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Core conversion logic
  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  // ✅ Guard against non-object JSON
  if (typeof jsonData !== 'object' || jsonData === null) {
    return res.status(400).json({ error: 'JSON must be an object or array.' });
  }

  const dataToConvert = buildElements(jsonData);
  let xmlOp = convert.json2xml(dataToConvert, xmlOptions);

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
