import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import YAML from 'yaml';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { toolsLimit } from '@middleware/toolsLimit';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
initDirs();

const uploadDir = globals.uploadDir + '/yamltojson';
const downloadDir = globals.downloadDir + '/yamltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

const yamlParseOptions = {
  prettyErrors: true,
};

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('yamltojson').maxFileSize, tieredBatch: true }), // 100MB
  ]);

  // Core conversion logic
  const yamlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const yamlContent = await YAML.parse(yamlRead, yamlParseOptions);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, JSON.stringify(yamlContent, null, 4), 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. YAML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
