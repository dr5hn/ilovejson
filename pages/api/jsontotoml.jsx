import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import TOML from '@iarna/toml';
import { ReS, ReE } from '@utils/reusables';
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

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // ✅ Handle invalid JSON gracefully
  let jsonData;
  try {
    const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
    jsonData = JSON.parse(jsonRead);
  } catch (err) {
    return ReE(res, 'Invalid JSON file. Please upload a valid JSON file.', 422);
  }

  // ✅ TOML requires a root object — wrap arrays under a key
  let tomlInput = jsonData;
  if (Array.isArray(jsonData)) {
    tomlInput = { items: jsonData };
  } else if (typeof tomlInput !== 'object' || tomlInput === null) {
    return ReE(res, 'JSON root must be an object or array to convert to TOML.', 422);
  }

  // ✅ Handle TOML.stringify errors (e.g. null values, mixed-type arrays)
  let tomlOutput;
  try {
    tomlOutput = TOML.stringify(tomlInput);
  } catch (err) {
    return ReE(
      res,
      `Failed to convert JSON to TOML: ${err.message}. TOML does not support null values or mixed-type arrays.`,
      422
    );
  }

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
