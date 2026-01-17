import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/typescripttojson';
const downloadDir = globals.downloadDir + '/typescripttojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

function mapTSTypeToJSON(tsType) {
  const typeMap = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    any: 'any',
    null: 'null',
    undefined: 'undefined',
  };

  const lowerType = tsType.toLowerCase().trim();
  if (typeMap[lowerType]) {
    return typeMap[lowerType];
  }
  if (tsType.endsWith('[]')) {
    return `array<${mapTSTypeToJSON(tsType.slice(0, -2))}>`;
  }
  return tsType;
}

function parseTypeScriptInterfaces(tsContent) {
  const interfaces = {};

  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;

  let match;
  while ((match = interfaceRegex.exec(tsContent)) !== null) {
    const name = match[1];
    const body = match[2];

    const properties = {};
    const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;

    let propMatch;
    while ((propMatch = propRegex.exec(body)) !== null) {
      const propName = propMatch[1];
      const isOptional = !!propMatch[2];
      const propType = propMatch[3].trim();

      properties[propName] = {
        type: mapTSTypeToJSON(propType),
        optional: isOptional,
      };
    }

    interfaces[name] = properties;
  }

  return interfaces;
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }),
  ]);

  const tsRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const interfaces = parseTypeScriptInterfaces(tsRead);

  if (Object.keys(interfaces).length === 0) {
    return ReE(res, 'No valid TypeScript interfaces found.', 422);
  }

  const jsonOutput = JSON.stringify(interfaces, null, 2);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. TypeScript to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
