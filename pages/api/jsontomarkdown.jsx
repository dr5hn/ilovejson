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

const uploadDir = globals.uploadDir + '/jsontomarkdown';
const downloadDir = globals.downloadDir + '/jsontomarkdown';

export const config = {
  api: {
    bodyParser: false,
  },
};

function jsonToMarkdown(data) {
  // Handle empty array explicitly
  if (Array.isArray(data) && data.length === 0) {
    return '_No data available._';
  }

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    // Array of objects - create table
    // ✅ Collect all unique keys across all rows, not just data[0]
    const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
    let markdown = '| ' + keys.join(' | ') + ' |\n';
    markdown += '| ' + keys.map(() => '---').join(' | ') + ' |\n';

    data.forEach((item) => {
      const values = keys.map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/\|/g, '\\|');
        return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
      });
      markdown += '| ' + values.join(' | ') + ' |\n';
    });

    return markdown;
  } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // Single object - create key-value list or table
    const entries = Object.entries(data);
    if (
      entries.length > 0 &&
      entries.every(([_, v]) => typeof v !== 'object' || v === null || Array.isArray(v))
    ) {
      // Simple key-value pairs - use table
      let markdown = '| Key | Value |\n';
      markdown += '| --- | --- |\n';
      entries.forEach(([key, value]) => {
        let valueStr = '';
        if (value === null) valueStr = 'null';
        else if (value === undefined) valueStr = '';
        else if (typeof value === 'object') valueStr = JSON.stringify(value).replace(/\|/g, '\\|');
        else valueStr = String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
        markdown += `| ${key.replace(/\|/g, '\\|')} | ${valueStr} |\n`;
      });
      return markdown;
    } else {
      // Complex nested object - use headings
      let markdown = '';
      entries.forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          markdown += `## ${key}\n\n${jsonToMarkdown(value)}\n\n`;
        } else {
          let valueStr = '';
          if (value === null) valueStr = 'null';
          else if (value === undefined) valueStr = '';
          else if (typeof value === 'object') valueStr = JSON.stringify(value);
          else valueStr = String(value);
          markdown += `**${key}**: ${valueStr}\n\n`;
        }
      });
      return markdown;
    }
  } else if (Array.isArray(data) && data.length > 0) {
    // Array of primitives
    let markdown = '| Value |\n';
    markdown += '| --- |\n';
    data.forEach((item) => {
      const value = typeof item === 'object' ? JSON.stringify(item) : String(item);
      markdown += `| ${value.replace(/\|/g, '\\|')} |\n`;
    });
    return markdown;
  } else {
    // Primitive value
    return String(data);
  }
}

async function handler(req, res) {
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    toolsLimit(),
    parseFile(uploadDir, { maxFileSize: getToolLimits('jsontomarkdown').maxFileSize, tieredBatch: true }),
  ]);

  // ✅ Guard against missing file
  if (!req.uploadedFile?.path) {
    return ReE(res, 'No file uploaded.', 400);
  }

  let jsonData;
  try {
    const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
    jsonData = JSON.parse(jsonRead);
  } catch (err) {
    return ReE(res, 'Invalid JSON file. Please upload a valid JSON file.', 422);
  }

  const markdownContent = jsonToMarkdown(jsonData);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.md`;
  fs.writeFileSync(outputFilePath, markdownContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to Markdown Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
