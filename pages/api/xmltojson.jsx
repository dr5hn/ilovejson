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

const uploadDir = globals.uploadDir + '/xmltojson';
const downloadDir = globals.downloadDir + '/xmltojson';

export const config = {
  api: { bodyParser: false },
};

const jsonOptions = {
  compact: false,
  ignoreComment: true,
  alwaysChildren: true,
  // ✅ removed spaces — only valid for json2xml, has no effect here
};

// ✅ Cast any field whose value looks like a number (not hardcoded field names)
function castTypes(arr) {
  return arr.map(item => {
    const casted = { ...item };
    for (const key in casted) {
      if (casted[key] !== undefined && casted[key] !== '') {
        const num = Number(casted[key]);
        if (!isNaN(num)) casted[key] = num;
      }
    }
    return casted;
  });
}

// ✅ Rewritten to correctly handle compact: false element structure
function simplifyXmlJson(node) {
  if (!node) return null;

  // Text node — return raw value
  if (node.type === 'text') return node.text;

  if (node.type === 'element') {
    if (!node.elements || node.elements.length === 0) return null;

    // Single text child — return value directly
    if (node.elements.length === 1 && node.elements[0].type === 'text') {
      return node.elements[0].text;
    }

    // Group child elements by name
    const result = {};
    for (const child of node.elements) {
      const key = child.name;
      const val = simplifyXmlJson(child);
      if (result[key] !== undefined) {
        if (!Array.isArray(result[key])) result[key] = [result[key]];
        result[key].push(val);
      } else {
        result[key] = val;
      }
    }

    // Merge attributes if present
    if (node.attributes) Object.assign(result, node.attributes);
    return result;
  }

  // Root document node — find first element child
  if (node.elements) {
    const rootEl = node.elements.find(e => e.type === 'element');
    return rootEl ? simplifyXmlJson(rootEl) : null;
  }

  return null;
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const xmlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonObj = JSON.parse(convert.xml2json(xmlRead, jsonOptions));

  const simplifiedJson = simplifyXmlJson(jsonObj);

  // ✅ Apply castTypes to array results
  const finalJson = Array.isArray(simplifiedJson)
    ? castTypes(simplifiedJson)
    : simplifiedJson;

  const jsonContent = JSON.stringify(finalJson, null, 4);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. XML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
