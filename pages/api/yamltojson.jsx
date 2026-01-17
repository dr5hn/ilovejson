import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import YAML from 'yaml';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/yamltojson';
const downloadDir = globals.downloadDir + '/yamltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

const yamlOptions = {
  indent: 4,
  prettyErrors: true,
};

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic
  const yamlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const yamlContent = await YAML.parse(yamlRead, yamlOptions);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, JSON.stringify(yamlContent, undefined, 4), 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. YAML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
