import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontophp';
const downloadDir = globals.downloadDir + '/jsontophp';

export const config = {
  api: {
    bodyParser: false,
  },
}

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

// Process a POST request
export default async (req, res) => {
  // TODO: This should be in middleware.
  if (req.method !== 'POST') {
    return ReE(res, 'I ❤️ JSON. But you shouldn\'t be here.');
  }

  // parse form with a Promise wrapper
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.uploadDir = uploadDir;
    form.keepExtensions = true;
    form.parse(req, async (_err, _fields, files) => {
      if (_err) return reject(_err);
      resolve({ _fields, files });
    });
  });

  if (!(data.files && data.files.fileInfo)) {
    return ReE(res, 'I ❤️ JSON. But you forgot to bring something to me.');
  }

  // Get file path - handle different formidable structures
  const fileInfo = data.files.fileInfo;
  let filePath = fileInfo.filepath || fileInfo.path;
  if (Array.isArray(fileInfo)) {
    const firstFile = fileInfo[0];
    filePath = firstFile.filepath || firstFile.path;
  }
  if (!filePath) {
    return ReE(res, 'I ❤️ JSON. But I couldn\'t find the file path.');
  }

  const jsonRead = fs.readFileSync(filePath, 'utf8');
  try {
    if (JSON.parse(jsonRead) && !!jsonRead) {
      const jsonData = JSON.parse(jsonRead);
      const phpArray = jsObjectToPhpArray(jsonData);
      const phpCode = `<?php\n\n$data = ${phpArray};\n`;
      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.php`;
      fs.writeFileSync(filePath, phpCode, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. JSON to PHP Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid JSON.');
  }
}
