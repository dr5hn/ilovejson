import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';
const convert = require('xml-js');

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontoxml';
const downloadDir = globals.downloadDir + '/jsontoxml';

export const config = {
  api: {
    bodyParser: false,
  },
}

const xmlOptions = {
  compact: true, // BUGGY
  ignoreComment: false,
  spaces: 2
}

// Process a POST request
export default async (req, res) => {
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

  var jsonRead = fs.readFileSync(filePath, 'utf8');

  try {
    if (JSON.parse(jsonRead) && !!jsonRead) {
      let jsonData = JSON.parse(jsonRead);
      // Prepare data structure for XML conversion
      let dataToConvert;
      if (Array.isArray(jsonData)) {
        // For arrays, create root with multiple item elements
        dataToConvert = { root: { item: jsonData } };
      } else {
        // For single object, wrap in root with single item
        dataToConvert = { root: { item: [jsonData] } };
      }

      var xmlOp = convert.json2xml(JSON.stringify(dataToConvert), xmlOptions);
      
      // Add XML declaration
      xmlOp = '<?xml version="1.0" encoding="UTF-8"?>\n\n' + xmlOp;

      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.xml`;
      fs.writeFileSync(filePath, xmlOp, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. JSON to XML Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid JSON.');
  }
}
