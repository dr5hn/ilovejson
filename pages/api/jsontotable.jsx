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

const uploadDir = globals.uploadDir + '/jsontotable';
const downloadDir = globals.downloadDir + '/jsontotable';

export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Helper function to format value for display
function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    return '<pre>' + escapeHtml(JSON.stringify(value, null, 2)) + '</pre>';
  }
  return escapeHtml(String(value));
}

// Helper function to convert JSON to HTML table
function jsonToHtmlTable(data) {
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">\n';
  
  if (Array.isArray(data) && data.length > 0) {
    // Array of objects
    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const keys = Object.keys(data[0]);
      html += '  <thead>\n    <tr>\n';
      keys.forEach(key => {
        html += `      <th style="background-color: #f2f2f2; font-weight: bold; padding: 8px;">${escapeHtml(String(key))}</th>\n`;
      });
      html += '    </tr>\n  </thead>\n  <tbody>\n';
      
      data.forEach((item, index) => {
        const rowClass = index % 2 === 0 ? 'style="background-color: #f9f9f9;"' : '';
        html += `    <tr ${rowClass}>\n`;
        keys.forEach(key => {
          html += `      <td style="padding: 8px;">${formatValue(item[key])}</td>\n`;
        });
        html += '    </tr>\n';
      });
      
      html += '  </tbody>\n';
    } else {
      // Array of primitives
      html += '  <thead>\n    <tr>\n';
      html += '      <th style="background-color: #f2f2f2; font-weight: bold; padding: 8px;">Value</th>\n';
      html += '    </tr>\n  </thead>\n  <tbody>\n';
      data.forEach((item, index) => {
        const rowClass = index % 2 === 0 ? 'style="background-color: #f9f9f9;"' : '';
        html += `    <tr ${rowClass}>\n`;
        html += `      <td style="padding: 8px;">${formatValue(item)}</td>\n`;
        html += '    </tr>\n';
      });
      html += '  </tbody>\n';
    }
  } else if (typeof data === 'object' && data !== null) {
    // Single object - key-value table
    html += '  <tbody>\n';
    const entries = Object.entries(data);
    entries.forEach(([key, value], index) => {
      const rowClass = index % 2 === 0 ? 'style="background-color: #f9f9f9;"' : '';
      html += `    <tr ${rowClass}>\n`;
      html += `      <th style="background-color: #f2f2f2; font-weight: bold; padding: 8px; text-align: left;">${escapeHtml(String(key))}</th>\n`;
      html += `      <td style="padding: 8px;">${formatValue(value)}</td>\n`;
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
  } else {
    // Primitive value
    html += '  <tbody>\n';
    html += '    <tr>\n';
    html += `      <td style="padding: 8px;">${formatValue(data)}</td>\n`;
    html += '    </tr>\n';
    html += '  </tbody>\n';
  }
  
  html += '</table>';
  return html;
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
  const tableHtml = jsonToHtmlTable(jsonData);
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Table</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>JSON Data Table</h1>
    ${tableHtml}
  </div>
</body>
</html>`;
      
  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.html`;
  fs.writeFileSync(outputFilePath, htmlContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. JSON to HTML Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
