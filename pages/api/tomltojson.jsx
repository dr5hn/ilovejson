import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import TOML from '@iarna/toml';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/tomltojson';
const downloadDir = globals.downloadDir + '/tomltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const tomlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  // ✅ Handle invalid TOML gracefully
  let jsonData;
  try {
    jsonData = TOML.parse(tomlRead);
  } catch (err) {
    return res.status(422).json({ error: `Invalid TOML file: ${err.message}` });
  }

  const jsonOutput = JSON.stringify(jsonData, null, 2);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. TOML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
