import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';
import { XMLBuilder } from 'fast-xml-parser';
import fs from 'fs';
initDirs();

const uploadDir = globals.uploadDir + '/jsontoxml';
const downloadDir = globals.downloadDir + '/jsontoxml';

export const config = {
  api: {
    bodyParser: false,
  },
};

const builder = new XMLBuilder({
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
  processEntities: true,
});

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsontoxml').maxFileSize }),
  ]);

  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);

  if (typeof jsonData !== 'object' || jsonData === null) {
    return ReE(res, 'JSON must be an object or array.', 400);
  }

  // Wrap in root element for valid XML
  const wrapped = Array.isArray(jsonData)
    ? { root: { item: jsonData } }
    : { root: jsonData };

  let xmlOutput = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlOutput += builder.build(wrapped);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.xml`;
  fs.writeFileSync(outputFilePath, xmlOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to XML Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
