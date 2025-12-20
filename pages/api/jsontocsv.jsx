import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { json2csv } from 'json-2-csv';
import { ReE, ReS } from '@utils/reusables';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontocsv';
const downloadDir = globals.downloadDir + '/jsontocsv';

export const config = {
  api: {
    bodyParser: false,
  },
}

const options = {
  excelBOM: true,
  expandArrayObjects: false, // Should objects in array values be deep-converted to CSV?
  trimHeaderFields: true,
  trimFieldValues: true,
};

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
  
  // If fileInfo is an array, get the first element
  if (Array.isArray(fileInfo)) {
    const firstFile = fileInfo[0];
    filePath = firstFile.filepath || firstFile.path;
  }
  
  if (!filePath) {
    console.error('File path not found. FileInfo structure:', JSON.stringify(fileInfo, null, 2));
    return ReE(res, 'I ❤️ JSON. But I couldn\'t find the file path.');
  }

  var jsonRead = fs.readFileSync(filePath, 'utf8');
  try {
    if (JSON.parse(jsonRead) && !!jsonRead) {
      const jsonData = JSON.parse(jsonRead);
      const csv = json2csv(jsonData, options);
      
      const modifiedDate = new Date().getTime();
      const outputFilePath = `${downloadDir}/${modifiedDate}.csv`;
      fs.writeFileSync(outputFilePath, csv, 'utf8');

      let toPath = outputFilePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. JSON to CSV Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    console.log('ERROR: ' + e.message);
    return ReE(res, 'I ❤️ JSON. But you have entered invalid JSON.');
  }
}
