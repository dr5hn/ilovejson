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

const uploadDir = globals.uploadDir + '/jsontomarkdown';
const downloadDir = globals.downloadDir + '/jsontomarkdown';

export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to convert JSON to Markdown table
function jsonToMarkdown(data) {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    // Array of objects - create table
    const keys = Object.keys(data[0]);
    let markdown = '| ' + keys.join(' | ') + ' |\n';
    markdown += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
    
    data.forEach(item => {
      const values = keys.map(key => {
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
    if (entries.length > 0 && entries.every(([_, v]) => typeof v !== 'object' || v === null || Array.isArray(v))) {
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
    data.forEach(item => {
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
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic
  const jsonRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = JSON.parse(jsonRead);
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

