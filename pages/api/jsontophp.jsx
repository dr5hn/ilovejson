import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontophp';
const downloadDir = globals.downloadDir + '/jsontophp';

export const config = {
  api: {
    bodyParser: false,
  },
};

function jsObjectToPhpArray(obj, indentLevel = 0) {
  const indent = ' '.repeat(indentLevel * 4);
  const arrayEntries = Object.entries(obj).map(([key, value]) => {
    const isNumericKey = !isNaN(key);
    const phpKey = isNumericKey ? '' : `'${key}' => `;

    // ✅ Handle null explicitly before typeof object check
    let phpValue;
    if (value === null) {
      phpValue = 'null';
    } else if (typeof value === 'object') {
      phpValue = jsObjectToPhpArray(value, indentLevel + 1);
    } else if (typeof value === 'string') {
      phpValue = `'${value.replace(/'/g, "\\'")}'`;
    } else {
      phpValue = value;
    }

    return `${indent}    ${phpKey}${phpValue}`;
  });

  return `[\n${arrayEntries.join(',\n')}\n${indent}]`;
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

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  // ✅ Validate input type
  if (typeof jsonData !== 'object' || jsonData === null) {
    return res.status(400).json({ error: 'JSON must be an object or array.' });
  }

  const phpArray = jsObjectToPhpArray(jsonData);
  const phpCode = `<?php\n\n$data = ${phpArray};\n`;

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.php`;
  fs.writeFileSync(outputFilePath, phpCode, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to PHP Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
