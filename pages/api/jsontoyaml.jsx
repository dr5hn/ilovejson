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

const uploadDir = globals.uploadDir + '/jsontoyaml';
const downloadDir = globals.downloadDir + '/jsontoyaml';

export const config = {
  api: {
    bodyParser: false,
  },
};

const yamlOptions = {
  indent: 4,
};

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsontoyaml').maxFileSize, tieredBatch: true }), // 100MB
  ]);

  // Core conversion logic
  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);
  const yaml = YAML.stringify(jsonData, null, yamlOptions);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.yml`;
  fs.writeFileSync(outputFilePath, yaml, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to YAML Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
