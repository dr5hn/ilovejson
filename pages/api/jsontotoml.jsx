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

const uploadDir = globals.uploadDir + '/jsontotoml';
const downloadDir = globals.downloadDir + '/jsontotoml';

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

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  const tomlOutput = TOML.stringify(jsonData);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.toml`;
  fs.writeFileSync(outputFilePath, tomlOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to TOML Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
