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

const uploadDir = globals.uploadDir + '/htmltojson';
const downloadDir = globals.downloadDir + '/htmltojson';

export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to extract text from HTML tag
function extractText(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Helper function to parse HTML tables and convert to JSON
function htmlToJson(htmlContent) {
  // Extract all tables using regex
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const tables = [];
  let match;
  
  while ((match = tableRegex.exec(htmlContent)) !== null) {
    tables.push(match[1]);
  }
  
  if (tables.length === 0) {
    throw new Error('No HTML table found in the file');
  }
  const result = [];
  
  tables.forEach(tableHtml => {
    // Extract rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [];
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      rows.push(rowMatch[1]);
    }
    
    if (rows.length === 0) return;
    
    // Extract cells from first row (headers)
    const firstRow = rows[0];
    const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
    const headerCells = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(firstRow)) !== null) {
      headerCells.push(extractText(cellMatch[2]));
    }
    
    if (headerCells.length === 0) return;
    
    // Check if this is a key-value table
    const isKeyValueTable = headerCells.length === 2 && 
      (headerCells[0] === 'Key' && headerCells[1] === 'Value');
    
    if (isKeyValueTable) {
      // Key-Value table
      const obj = {};
      for (let i = 1; i < rows.length; i++) {
        const cells = [];
        const cellRegex2 = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
        let cellMatch2;
        while ((cellMatch2 = cellRegex2.exec(rows[i])) !== null) {
          cells.push(extractText(cellMatch2[2]));
        }
        
        if (cells.length === 2) {
          const key = cells[0];
          let value = cells[1];
          
          // Try to parse value
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null' || value === '') value = null;
          else if (!isNaN(value) && value !== '') {
            const num = Number(value);
            if (!isNaN(num)) value = num;
          } else {
            // Check if value contains <pre> tag (JSON)
            const preMatch = rows[i].match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            if (preMatch) {
              try {
                value = JSON.parse(preMatch[1]);
              } catch (e) {
                // Keep as string
              }
            } else {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep as string
              }
            }
          }
          obj[key] = value;
        }
      }
      if (Object.keys(obj).length > 0) {
        result.push(obj);
      }
    } else if (headerCells.length === 2) {
      // Potential key-value table without "Key"/"Value" headers
      const obj = {};
      for (let i = 0; i < rows.length; i++) {
        const cells = [];
        const cellRegex2 = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
        let cellMatch2;
        while ((cellMatch2 = cellRegex2.exec(rows[i])) !== null) {
          cells.push(extractText(cellMatch2[2]));
        }
        
        if (cells.length === 2) {
          const key = cells[0];
          let value = cells[1];
          
          // Try to parse value
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null' || value === '') value = null;
          else if (!isNaN(value) && value !== '') {
            const num = Number(value);
            if (!isNaN(num)) value = num;
          } else {
            // Check if value contains <pre> tag (JSON)
            const preMatch = rows[i].match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            if (preMatch) {
              try {
                value = JSON.parse(preMatch[1]);
              } catch (e) {
                // Keep as string
              }
            } else {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep as string
              }
            }
          }
          obj[key] = value;
        }
      }
      if (Object.keys(obj).length > 0) {
        result.push(obj);
      }
    } else {
      // Regular table with headers
      const tableData = [];
      
      for (let i = 1; i < rows.length; i++) {
        const cells = [];
        const cellRegex2 = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
        let cellMatch2;
        while ((cellMatch2 = cellRegex2.exec(rows[i])) !== null) {
          cells.push(extractText(cellMatch2[2]));
        }
        
        if (cells.length === headerCells.length) {
          const row = {};
          headerCells.forEach((header, idx) => {
            let value = cells[idx] || '';
            
            // Check if value contains <pre> tag (JSON)
            const preMatch = rows[i].match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            if (preMatch) {
              try {
                value = JSON.parse(preMatch[1]);
              } catch (e) {
                value = extractText(preMatch[1]);
              }
            } else {
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
                  // Keep as string
                }
              }
            }
            row[header] = value;
          });
          tableData.push(row);
        }
      }
      
      if (tableData.length > 0) {
        result.push(...tableData);
      }
    }
  });
  
  // Return appropriate structure
  if (result.length === 0) {
    throw new Error('No data could be extracted from HTML tables');
  } else if (result.length === 1) {
    return result[0];
  } else {
    return result;
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
  const htmlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');
  const jsonData = htmlToJson(htmlRead);
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
