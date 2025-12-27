import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
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
}

// Helper function to parse Markdown and convert to JSON
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
    
    // Check for table header
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      
      // Check if next line is separator (---)
      if (index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();
        if (nextLine.match(/^\|[\s\-:]+\|$/)) {
          // This is a table header
          headers = cells;
          inTable = true;
          currentTable = [];
          return;
        }
      }
      
      // If we're in a table, parse row
      if (inTable && headers.length > 0) {
        // Skip separator lines
        if (trimmed.match(/^\|[\s\-:]+\|$/)) {
          return;
        }
        
        if (cells.length === headers.length) {
          const row = {};
          headers.forEach((header, idx) => {
            let value = cells[idx] || '';
            // Try to parse as number, boolean, or null
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (value === 'null' || value === '') value = null;
            else if (!isNaN(value) && value !== '') {
              const num = Number(value);
              if (!isNaN(num)) value = num;
            } else {
              // Try to parse as JSON
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep as string, unescape pipes
                value = value.replace(/\\\|/g, '|').replace(/<br>/g, '\n');
              }
            }
            row[header] = value;
          });
          
          // Skip rows where all values are "---"
          const allValues = Object.values(row);
          const isSeparatorRow = allValues.length > 0 && allValues.every(v => v === '---' || String(v).trim() === '---');
          if (!isSeparatorRow) {
            currentTable.push(row);
          }
        }
      } else if (cells.length === 2 && cells[0] === 'Key' && cells[1] === 'Value') {
        // Key-Value table header
        headers = ['Key', 'Value'];
        inTable = true;
        currentTable = {};
        return;
      } else if (inTable && headers.length === 2 && headers[0] === 'Key') {
        // Key-Value table row
        if (cells.length === 2) {
          let value = cells[1] || '';
          // Try to parse value
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null' || value === '') value = null;
          else if (!isNaN(value) && value !== '') {
            const num = Number(value);
            if (!isNaN(num)) value = num;
          } else {
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = value.replace(/\\\|/g, '|').replace(/<br>/g, '\n');
            }
          }
          currentTable[cells[0]] = value;
        }
      } else if (!inTable && cells.length >= 2) {
        // Try to detect table without explicit header separator
        if (index === 0 || (index > 0 && !lines[index - 1].trim().match(/^\|[\s\-:]+\|$/))) {
          if (headers.length === 0) {
            headers = cells;
            inTable = true;
            currentTable = [];
          } else if (inTable && cells.length === headers.length) {
            const row = {};
            headers.forEach((header, idx) => {
              let value = cells[idx] || '';
              if (value === 'true') value = true;
              else if (value === 'false') value = false;
              else if (value === 'null' || value === '') value = null;
              else if (!isNaN(value) && value !== '') {
                const num = Number(value);
                if (!isNaN(num)) value = num;
              } else {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  value = value.replace(/\\\|/g, '|').replace(/<br>/g, '\n');
                }
              }
              row[header] = value;
            });
            
            // Skip separator rows
            const allValues = Object.values(row);
            const isSeparatorRow = allValues.length > 0 && allValues.every(v => v === '---' || String(v).trim() === '---');
            if (!isSeparatorRow) {
              currentTable.push(row);
            }
          }
        }
      }
    } else {
      // Not a table line
      if (inTable) {
        // End of table
        if (currentTable) {
          if (Array.isArray(currentTable) && currentTable.length > 0) {
            result.push(...currentTable);
          } else if (Object.keys(currentTable).length > 0) {
            result.push(currentTable);
          }
        }
        inTable = false;
        headers = [];
        currentTable = null;
      }
      
      // Check for headings
      if (trimmed.startsWith('##')) {
        const heading = trimmed.replace(/^##+\s*/, '');
        lastHeading = heading;
        if (!currentObject[heading]) {
          currentObject[heading] = {};
        }
      } else if (trimmed.startsWith('#')) {
        const heading = trimmed.replace(/^#+\s*/, '');
        lastHeading = heading;
        if (!currentObject[heading]) {
          currentObject[heading] = {};
        }
      } else if (trimmed.includes('**') && trimmed.includes(':')) {
        // Key-value pair: **key**: value
        const match = trimmed.match(/\*\*([^*]+)\*\*:\s*(.+)/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Try to parse value
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null') value = null;
          else if (!isNaN(value) && value !== '') {
            const num = Number(value);
            if (!isNaN(num)) value = num;
          } else {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Keep as string
            }
          }
          if (lastHeading && currentObject[lastHeading]) {
            currentObject[lastHeading][key] = value;
          } else {
            currentObject[key] = value;
          }
        }
      } else if (trimmed.includes(':') && !trimmed.startsWith('|')) {
        // Simple key-value pair without **
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          let value = trimmed.substring(colonIndex + 1).trim();
          if (value) {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (value === 'null') value = null;
            else if (!isNaN(value) && value !== '') {
              const num = Number(value);
              if (!isNaN(num)) value = num;
            }
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
  
  // Handle remaining table
  if (inTable && currentTable) {
    if (Array.isArray(currentTable) && currentTable.length > 0) {
      const filteredTable = currentTable.filter(row => {
        const allValues = Object.values(row);
        return !(allValues.length > 0 && allValues.every(v => v === '---' || String(v).trim() === '---'));
      });
      if (filteredTable.length > 0) {
        result.push(...filteredTable);
      }
    } else if (Object.keys(currentTable).length > 0) {
      const allValues = Object.values(currentTable);
      const isSeparator = allValues.length > 0 && allValues.every(v => v === '---' || String(v).trim() === '---');
      if (!isSeparator) {
        result.push(currentTable);
      }
    }
  }
  
  // Filter result array to remove any separator rows
  const filteredResult = result.filter(item => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const allValues = Object.values(item);
      return !(allValues.length > 0 && allValues.every(v => v === '---' || String(v).trim() === '---'));
    }
    return true;
  });
  
  // Return result
  if (filteredResult.length > 0) {
    return filteredResult.length === 1 ? filteredResult[0] : filteredResult;
  } else if (Object.keys(currentObject).length > 0) {
    return currentObject;
  } else {
    return { content: markdown.trim() };
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
