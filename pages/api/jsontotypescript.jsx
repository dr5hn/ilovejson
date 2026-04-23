import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { jsonToTypescript } from '@lib/converters';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
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
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsontotypescript').maxFileSize }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  // ✅ Validate input type
  if (typeof jsonData !== 'object' || jsonData === null) {
    return ReE(res, 'JSON must be an object or array.', 400);
  }

  // Read rootName from formidable-parsed fields (req.body is undefined when bodyParser: false)
  const rootField = req.uploadedFile?.fields?.rootName;
  const rootName = (Array.isArray(rootField) ? rootField[0] : rootField) || 'RootObject';
  const tsOutput = jsonToTypescript(jsonData, rootName);

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
