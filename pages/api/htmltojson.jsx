import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';

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

  const htmlRead = fs.readFileSync(filePath, 'utf8');
  try {
   
    const jsonData = htmlToJson(htmlRead);
    const jsonContent = JSON.stringify(jsonData, null, 4);
    
    if (!!jsonContent) {
      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.json`;
      fs.writeFileSync(filePath, jsonContent, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. HTML to JSON Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid HTML.');
  }
}

