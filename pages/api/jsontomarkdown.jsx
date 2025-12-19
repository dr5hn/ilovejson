import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';

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

// Process a POST request
export default async (req, res) => {
  // TODO: This should be in middleware.
  if (req.method !== 'POST') {
    return ReE(res, 'I ❤️ JSON. But you shouldn\'t be here.');
  }

  // parse form with a Promise wrapper
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.uploadDir = uploadDir;
    form.keepExtensions = true;
    form.parse(req, async (_err, _fields, files) => {
      if (_err) return reject(_err);
      resolve({ _fields, files });
    });
  });

  if (!(data.files && data.files.fileInfo)) {
    return ReE(res, 'I ❤️ JSON. But you forgot to bring something to me.');
  }

  // Get file path - handle different formidable structures
  const fileInfo = data.files.fileInfo;
  let filePath = fileInfo.filepath || fileInfo.path;
  if (Array.isArray(fileInfo)) {
    const firstFile = fileInfo[0];
    filePath = firstFile.filepath || firstFile.path;
  }
  if (!filePath) {
    return ReE(res, 'I ❤️ JSON. But I couldn\'t find the file path.');
  }

  const jsonRead = fs.readFileSync(filePath, 'utf8');
  try {
    if (JSON.parse(jsonRead) && !!jsonRead) {
      const jsonData = JSON.parse(jsonRead);
      const markdownContent = jsonToMarkdown(jsonData);
      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.md`;
      fs.writeFileSync(filePath, markdownContent, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. JSON to Markdown Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid JSON.');
  }
}

