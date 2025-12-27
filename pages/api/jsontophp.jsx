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
  const indent = ' '.repeat(indentLevel * 4); // 4 spaces per indent
  const arrayEntries = Object.entries(obj).map(([key, value]) => {
      // Determine if the key is numeric
      const isNumericKey = !isNaN(key);

      // Format the PHP key
      const phpKey = isNumericKey ? '' : `'${key}' => `;

      // Determine the PHP value
      const phpValue = typeof value === 'object' ?
          jsObjectToPhpArray(value, indentLevel + 1) :
          (typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : value);

      return `${indent}    ${phpKey}${phpValue}`;
  });

  return `[\n${arrayEntries.join(',\n')}\n${indent}]`;
}

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
