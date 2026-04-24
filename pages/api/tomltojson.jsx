import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { parse as tomlParse } from 'smol-toml';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { toolsLimit } from '@middleware/toolsLimit';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
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
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('tomltojson').maxFileSize, tieredBatch: true }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const tomlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  // ✅ Handle invalid TOML gracefully
  let jsonData;
  try {
    jsonData = tomlParse(tomlRead);
  } catch (err) {
    return ReE(res, `Invalid TOML file: ${err.message}`, 422);
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
