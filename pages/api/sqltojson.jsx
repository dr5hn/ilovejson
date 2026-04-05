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

const uploadDir = globals.uploadDir + '/sqltojson';
const downloadDir = globals.downloadDir + '/sqltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseValue(val) {
  if (val.toUpperCase() === 'NULL') return null;
  if (val.startsWith("'") || val.startsWith('"')) {
    return val.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  if (!isNaN(Number(val))) return Number(val);
  return val;
}

function parseRowValues(valuesStr) {
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = null;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar) {
      if (valuesStr[i + 1] === stringChar) {
        current += char + char;
        i++;
      } else {
        inString = false;
        stringChar = null;
        current += char;
      }
    } else if (!inString && char === ',') {
      values.push(parseValue(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

// ✅ Character-aware tuple extractor — handles parentheses inside values
function extractRowTuples(str) {
  const tuples = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '(') {
      let depth = 1;
      let inStr = false;
      let strChar = null;
      let content = '';
      i++;
      while (i < str.length && depth > 0) {
        const ch = str[i];
        if (!inStr && (ch === "'" || ch === '"')) {
          inStr = true;
          strChar = ch;
        } else if (inStr && ch === strChar && str[i + 1] === strChar) {
          // Escaped quote ('' or "")
          content += ch + ch;
          i += 2;
          continue;
        } else if (inStr && ch === strChar) {
          inStr = false;
        } else if (!inStr && ch === '(') {
          depth++;
        } else if (!inStr && ch === ')') {
          depth--;
          if (depth === 0) { i++; break; }
        }
        content += ch;
        i++;
      }
      tuples.push(content);
    } else {
      i++;
    }
  }
  return tuples;
}

function sqlToJSON(sqlContent) {
  const results = {};

  const insertRegex =
    /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?)(?=;)/gi;

  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columns = match[2]
      .split(',')
      .map((c) => c.trim().replace(/[`"']/g, ''));
    const allValuesStr = match[3];

    if (!results[tableName]) {
      results[tableName] = [];
    }

    // ✅ Use character-aware extractor instead of [^)]+ regex
    const tuples = extractRowTuples(allValuesStr);
    for (const tupleContent of tuples) {
      const values = parseRowValues(tupleContent);
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = values[idx] !== undefined ? values[idx] : null;
      });
      results[tableName].push(obj);
    }
  }

  return results;
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: getToolLimits('sqltojson').maxFileSize }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const sqlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = sqlToJSON(sqlRead);

  if (Object.keys(jsonData).length === 0) {
    return ReE(res, 'No valid INSERT statements found in SQL file.', 422);
  }

  const jsonOutput = JSON.stringify(jsonData, null, 2);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonOutput, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. SQL to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
