import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
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

const uploadDir = globals.uploadDir + '/phptojson';
const downloadDir = globals.downloadDir + '/phptojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

function phpToJson(phpStr) {
  // Remove comments
  phpStr = phpStr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const parsePhpArray = (str, start = 0) => {
    let i = start;

    const skipWhitespace = () => {
      while (i < str.length && /\s/.test(str[i])) i++;
    };

    const parseString = (quote) => {
      i++; // skip opening quote
      let value = '';
      while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
          // Keep escape sequences as-is; JSON.stringify will handle final escaping
          const next = str[i + 1];
          if (next === 'n') value += '\n';
          else if (next === 'r') value += '\r';
          else if (next === 't') value += '\t';
          else if (next === '\\') value += '\\';
          else if (next === quote) value += quote;
          else value += str[i + 1];
          i += 2;
        } else if (str[i] === quote) {
          i++;
          break;
        } else {
          value += str[i];
          i++;
        }
      }
      return value;
    };

    const parseValue = () => {
      skipWhitespace();
      if (i >= str.length) return null;

      // String
      if (str[i] === '"' || str[i] === "'") {
        const quote = str[i];
        const value = parseString(quote);
        return { type: 'string', value };
      }

      // Array (long syntax)
      if (str.substr(i, 5).match(/^array\s*\(/i)) {
        i += str.substr(i).match(/^array\s*\(/i)[0].length;
        return parseArray(true);
      }
      // Array (short syntax)
      if (str[i] === '[') {
        i++;
        return parseArray(false);
      }

      // Number
      if (/[\d-]/.test(str[i])) {
        let numStr = '';
        if (str[i] === '-') { numStr += str[i]; i++; }
        while (i < str.length && /[\d.]/.test(str[i])) { numStr += str[i]; i++; }
        return { type: 'number', value: parseFloat(numStr) };
      }

      // Boolean / null
      const remaining = str.substr(i);
      if (remaining.match(/^true\b/i))  { i += 4; return { type: 'boolean', value: true }; }
      if (remaining.match(/^false\b/i)) { i += 5; return { type: 'boolean', value: false }; }
      if (remaining.match(/^null\b/i))  { i += 4; return { type: 'null', value: null }; }

      return null;
    };

    // ✅ isParens distinguishes array() vs [] for closing char
    const parseArray = (isParens = false) => {
      const closeChar = isParens ? ')' : ']';
      skipWhitespace();

      // ✅ Peek ahead for => to correctly detect associative arrays
      const isObject = !!str.substr(i).match(/^\s*(['"].*?['"]|\d+)\s*=>/);
      const result = isObject ? {} : [];
      let hasElements = false;

      while (i < str.length) {
        skipWhitespace();
        if (str[i] === closeChar) { i++; break; }
        if (str[i] === ',') { i++; continue; }

        if (isObject) {
          const keyValue = parseValue();
          if (!keyValue) break;
          skipWhitespace();
          if (str.substr(i, 2) === '=>') {
            i += 2;
            const value = parseValue();
            if (!value) break;
            result[keyValue.value] = convertToJson(value);
          } else {
            // No =>, treat as plain value
            const jsonVal = convertToJson(keyValue);
            if (Array.isArray(result)) result.push(jsonVal);
            hasElements = true;
            continue;
          }
        } else {
          const value = parseValue();
          if (!value) break;
          result.push(convertToJson(value));
        }

        hasElements = true;
        skipWhitespace();
        if (str[i] === ',') i++;
      }

      return result;
    };

    // ✅ Return raw values — let JSON.stringify handle escaping
    const convertToJson = (value) => {
      if (!value) return null;
      if (value.type === 'string') return value.value;
      if (value.type === 'number') return value.value;
      if (value.type === 'boolean') return value.value;
      if (value.type === 'null') return null;
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') return value;
      return value;
    };

    skipWhitespace();
    if (i < str.length) {
      if (str[i] === '[') { i++; return parseArray(false); }
      if (str.substr(i, 5).match(/^array\s*\(/i)) {
        i += str.substr(i).match(/^array\s*\(/i)[0].length;
        return parseArray(true);
      }
    }
    return parseValue();
  };

  const parsed = parsePhpArray(phpStr);
  return JSON.stringify(parsed, null, 4);
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('phptojson').maxFileSize, tieredBatch: true }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const phpRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  // Extract PHP array assignment
  let phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[/);
  if (!phpArrayMatch) {
    phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*array\s*\(/);
  }

  // ✅ Return proper error response instead of throwing
  if (!phpArrayMatch) {
    return ReE(res, 'Invalid PHP file. No valid array assignment found.', 422);
  }

  let arrayStart = phpRead.indexOf('[', phpArrayMatch.index);
  let isArraySyntax = true;
  if (arrayStart === -1) {
    arrayStart = phpRead.indexOf('array(', phpArrayMatch.index);
    if (arrayStart !== -1) {
      arrayStart += 5;
      isArraySyntax = false;
    }
  }

  if (arrayStart === -1) {
    return ReE(res, 'Invalid PHP file. Could not locate array content.', 422);
  }

  // ✅ Proper escape-aware brace counting
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let arrayEnd = arrayStart;
  const openChar = isArraySyntax ? '[' : '(';
  const closeChar = isArraySyntax ? ']' : ')';

  for (let i = arrayStart; i < phpRead.length; i++) {
    const char = phpRead[i];

    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
    } else if (!inString) {
      if (char === openChar) depth++;
      else if (char === closeChar) {
        depth--;
        if (depth === 0) { arrayEnd = i + 1; break; }
      }
    }
  }

  const arrayContent = phpRead.substring(arrayStart, arrayEnd);
  const jsonContent = phpToJson(arrayContent);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. PHP to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
