import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
initDirs();

const uploadDir = globals.uploadDir + '/xmltojson';
const downloadDir = globals.downloadDir + '/xmltojson';

export const config = {
  api: { bodyParser: false },
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Let fast-xml-parser handle array detection automatically
    return false;
  },
});

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: getToolLimits('xmltojson').maxFileSize }),
  ]);

  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const xmlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  let jsonData;
  try {
    jsonData = parser.parse(xmlRead);
  } catch (err) {
    return ReE(res, `Invalid XML file: ${err.message}`, 422);
  }

  const jsonContent = JSON.stringify(jsonData, null, 4);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. XML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
