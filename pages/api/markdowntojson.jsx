import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/markdowntojson';
const downloadDir = globals.downloadDir + '/markdowntojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

function isSeparatorLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
  const cells = trimmed.split('|').map((c) => c.trim()).filter((c) => c);
  return cells.length > 0 && cells.every((c) => /^[-:\s]+$/.test(c));
}

function isSeparatorRow(row) {
  const values = Object.values(row);
  return values.length > 0 && values.every((v) => /^-+$/.test(String(v).trim()));
}

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '') return null;
  if (!isNaN(value) && value !== '') {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value.replace(/\\\|/g, '|').replace(/<br>/g, '\n');
  }
}

// ✅ Helper to flush a completed table into the right place
function flushTable(currentTable, lastHeading, result, currentObject) {
  if (!currentTable) return;
  if (lastHeading) {
    // Group table under its heading
    if (Array.isArray(currentTable) && currentTable.length > 0) {
      if (!currentObject[lastHeading]) currentObject[lastHeading] = [];
      currentObject[lastHeading].push(...currentTable);
    } else if (!Array.isArray(currentTable) && Object.keys(currentTable).length > 0) {
      currentObject[lastHeading] = currentTable;
    }
  } else {
    if (Array.isArray(currentTable) && currentTable.length > 0) {
      result.push(...currentTable);
    } else if (!Array.isArray(currentTable) && Object.keys(currentTable).length > 0) {
      result.push(currentTable);
    }
  }
}

function markdownToJson(markdown) {
  const lines = markdown.trim().split('\n');
  const result = [];
  let currentTable = null;
  let headers = [];
  let inTable = false;
  let currentObject = {};
  let lastHeading = null;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map((c) => c.trim()).filter((c) => c);

      if (isSeparatorLine(trimmed)) return;

      if (!inTable) {
        const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';
        if (isSeparatorLine(nextLine)) {
          if (cells.length === 2 && cells[0] === 'Key' && cells[1] === 'Value') {
            headers = ['Key', 'Value'];
            inTable = true;
            currentTable = {};
          } else {
            headers = cells;
            inTable = true;
            currentTable = [];
          }
          return;
        }
        return;
      }

      if (inTable && headers.length > 0) {
        if (Array.isArray(currentTable) === false && headers[0] === 'Key') {
          if (cells.length === 2) {
            currentTable[cells[0]] = parseValue(cells[1]);
          }
          return;
        }

        if (cells.length === headers.length) {
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = parseValue(cells[idx] || '');
          });
          if (!isSeparatorRow(row)) {
            currentTable.push(row);
          }
        }
      }
    } else {
      // End of table — ✅ group under heading instead of flat merge
      if (inTable) {
        flushTable(currentTable, lastHeading, result, currentObject);
        inTable = false;
        headers = [];
        currentTable = null;
      }

      if (trimmed.startsWith('#')) {
        const heading = trimmed.replace(/^#+\s*/, '');
        lastHeading = heading;
        if (!currentObject[heading]) {
          currentObject[heading] = {};
        }
      } else if (trimmed.includes('**') && trimmed.includes(':')) {
        const match = trimmed.match(/\*\*([^*]+)\*\*:\s*(.+)/);
        if (match) {
          const key = match[1].trim();
          const value = parseValue(match[2].trim());
          if (lastHeading && currentObject[lastHeading]) {
            currentObject[lastHeading][key] = value;
          } else {
            currentObject[key] = value;
          }
        }
      } else if (trimmed.includes(':') && !trimmed.startsWith('|') && !trimmed.startsWith('-')) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          const rawValue = trimmed.substring(colonIndex + 1).trim();
          if (rawValue) {
            const value = parseValue(rawValue);
            if (lastHeading && currentObject[lastHeading]) {
              currentObject[lastHeading][key] = value;
            } else {
              currentObject[key] = value;
            }
          }
        }
      }
    }
  });

  // ✅ Handle remaining table at end of file — also grouped under heading
  if (inTable && currentTable) {
    flushTable(currentTable, lastHeading, result, currentObject);
  }

  if (result.length > 0) {
    return result.length === 1 ? result[0] : result;
  } else if (Object.keys(currentObject).length > 0) {
    return currentObject;
  } else {
    return { content: markdown.trim() };
  }
}

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

  const markdownRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = markdownToJson(markdownRead);
  const jsonContent = JSON.stringify(jsonData, null, 4);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. Markdown to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
