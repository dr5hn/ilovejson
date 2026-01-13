import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import JsonToTS from 'json-to-ts';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontotypescript';
const downloadDir = globals.downloadDir + '/jsontotypescript';

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

  const rootName = req.uploadedFile.fields?.rootName || 'RootObject';
  const tsInterfaces = JsonToTS(jsonData, { rootName });
  const tsOutput = tsInterfaces.join('\n\n');

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.ts`;
  fs.writeFileSync(outputFilePath, tsOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to TypeScript Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
