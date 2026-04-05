import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
import { getToolLimits } from '@constants/limits';

import fs from 'fs';
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

// ✅ Rewritten to use brace-counting instead of [^}]+ regex
// Fixes failure on interfaces with nested objects/braces
function parseTypeScriptInterfaces(tsContent) {
  const interfaces = {};
  const interfaceRegex = /interface\s+(\w+)\s*\{/g;

  let match;
  while ((match = interfaceRegex.exec(tsContent)) !== null) {
    const name = match[1];
    let depth = 1;
    let i = interfaceRegex.lastIndex;
    let body = '';

    // Walk characters counting braces to find true end of interface
    while (i < tsContent.length && depth > 0) {
      const ch = tsContent[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth > 0) body += ch;
      i++;
    }

    const properties = {};
    const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;
    let propMatch;
    while ((propMatch = propRegex.exec(body)) !== null) {
      properties[propMatch[1]] = {
        type: mapTSTypeToJSON(propMatch[3].trim()),
        optional: !!propMatch[2],
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
    parseFile(uploadDir, { maxFileSize: getToolLimits('typescripttojson').maxFileSize }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

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
