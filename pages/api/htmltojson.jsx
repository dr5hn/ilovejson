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

const uploadDir = globals.uploadDir + '/htmltojson';
const downloadDir = globals.downloadDir + '/htmltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

function extractText(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractCells(rowHtml) {
  const cells = [];
  const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
  let cellMatch;
  while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
    cells.push({ raw: cellMatch[2], text: extractText(cellMatch[2]) });
  }
  return cells;
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
    return value;
  }
}

// ✅ Depth-counting table extractor — handles nested <table> elements correctly
function extractTables(html) {
  const tables = [];
  let i = 0;
  const lower = html.toLowerCase();
  while (i < html.length) {
    const start = lower.indexOf('<table', i);
    if (start === -1) break;
    let depth = 0;
    let j = start;
    while (j < html.length) {
      if (lower.startsWith('<table', j) && (html[j + 6] === '>' || html[j + 6] === ' ')) {
        depth++;
        j += 6;
      } else if (lower.startsWith('</table>', j)) {
        depth--;
        if (depth === 0) {
          tables.push(html.substring(start, j + 8));
          i = j + 8;
          break;
        }
        j += 8;
      } else {
        j++;
      }
    }
    if (depth !== 0) break; // unclosed table — stop
  }
  return tables;
}

function htmlToJson(htmlContent) {
  if (!htmlContent || htmlContent.trim().length === 0) {
    throw new Error('The uploaded HTML file is empty.');
  }

  // ✅ Use depth-counting extractor instead of lazy regex
  const rawTables = extractTables(htmlContent);

  if (rawTables.length === 0) {
    const hasDivGrid = /<div[^>]*(class|role)[^>]*(grid|table|row)[^>]*>/i.test(htmlContent);
    if (hasDivGrid) {
      throw new Error(
        'No <table> element found. Your HTML appears to use <div> based layout (grid/flexbox). Only HTML files with <table>, <thead>, <tbody>, <tr>, <th>, <td> tags are supported.'
      );
    }
    throw new Error(
      'No <table> element found in the uploaded HTML file. Please make sure your HTML contains a valid <table> structure with <tr>, <th>, and <td> tags.'
    );
  }

  // Extract inner content of each table
  const tables = rawTables.map((t) => {
    const inner = t.match(/<table[^>]*>([\s\S]*)<\/table>/i);
    return inner ? inner[1] : '';
  });

  const result = [];

  tables.forEach((tableHtml) => {
    let headerCells = [];
    const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);

    if (theadMatch) {
      const theadRowMatch = theadMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
      if (theadRowMatch) {
        headerCells = extractCells(theadRowMatch[1]).map((c) => c.text);
      }
    }

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const allRows = [];
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      allRows.push(rowMatch[1]);
    }

    if (allRows.length === 0) return;

    if (headerCells.length === 0) {
      headerCells = extractCells(allRows[0]).map((c) => c.text);
    }

    if (headerCells.length === 0) return;

    const dataRows = allRows.filter((row) => {
      const hasOnlyTh = /<th[^>]*>/i.test(row) && !/<td[^>]*>/i.test(row);
      return !hasOnlyTh;
    });

    if (dataRows.length === 0) return;

    const isKeyValueTable =
      headerCells.length === 2 &&
      headerCells[0] === 'Key' &&
      headerCells[1] === 'Value';

    if (isKeyValueTable) {
      const obj = {};
      dataRows.forEach((row) => {
        const cells = extractCells(row);
        if (cells.length === 2) {
          const key = cells[0].text;
          const preMatch = cells[1].raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          let value;
          if (preMatch) {
            try { value = JSON.parse(preMatch[1]); }
            catch (e) { value = extractText(preMatch[1]); }
          } else {
            value = parseValue(cells[1].text);
          }
          obj[key] = value;
        }
      });
      if (Object.keys(obj).length > 0) result.push(obj);
    } else {
      const tableData = [];
      dataRows.forEach((row) => {
        const cells = extractCells(row);
        if (cells.length === headerCells.length) {
          const rowObj = {};
          headerCells.forEach((header, idx) => {
            const preMatch = cells[idx].raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            let value;
            if (preMatch) {
              try { value = JSON.parse(preMatch[1]); }
              catch (e) { value = extractText(preMatch[1]); }
            } else {
              value = parseValue(cells[idx].text);
            }
            rowObj[header] = value;
          });
          tableData.push(rowObj);
        }
      });
      if (tableData.length > 0) result.push(...tableData);
    }
  });

  if (result.length === 0) {
    throw new Error(
      'A <table> was found but no data rows could be extracted. Please make sure your table has <th> headers and <td> data rows.'
    );
  }

  return result.length === 1 ? result[0] : result;
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('htmltojson').maxFileSize, tieredBatch: true }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  const htmlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  let jsonData;
  try {
    jsonData = htmlToJson(htmlRead);
  } catch (err) {
    return ReE(res, err.message, 422);
  }

  const jsonContent = JSON.stringify(jsonData, null, 4);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. HTML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
