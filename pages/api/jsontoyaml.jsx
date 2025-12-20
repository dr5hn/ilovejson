import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import YAML from 'yaml';
import { ReE, ReS } from '@utils/reusables';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontoyaml';
const downloadDir = globals.downloadDir + '/jsontoyaml';

export const config = {
  api: {
    bodyParser: false,
  },
}

const yamlOptions = {
  indent: 4,
  prettyErrors: true,
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
      const yaml = YAML.stringify(JSON.parse(jsonRead), yamlOptions);

      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.yml`;
      fs.writeFileSync(filePath, yaml, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. JSON to YAML Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid JSON.');
  }

}
