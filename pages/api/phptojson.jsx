import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/phptojson';
const downloadDir = globals.downloadDir + '/phptojson';

export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to parse PHP array and convert to JSON
function phpToJson(phpStr) {
  // Remove comments
  phpStr = phpStr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  
  // Tokenize and parse PHP array
  const parsePhpArray = (str, start = 0) => {
    let i = start;
    const skipWhitespace = () => {
      while (i < str.length && /\s/.test(str[i])) i++;
    };
    
    const parseString = (quote) => {
      i++; // skip opening quote
      let value = '';
      while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
          value += str[i] + str[i + 1];
          i += 2;
        } else if (str[i] === quote) {
          i++;
          break;
        } else {
          value += str[i];
          i++;
        }
      }
      return value;
    };
    
    const parseValue = () => {
      skipWhitespace();
      if (i >= str.length) return null;
      
      // String
      if (str[i] === '"' || str[i] === "'") {
        const quote = str[i];
        const value = parseString(quote);
        return { type: 'string', value, quote };
      }
      
      // Array
      if (str.substr(i, 5).match(/^array\s*\(/i)) {
        i += str.substr(i).match(/^array\s*\(/i)[0].length;
        return parseArray();
      }
      if (str[i] === '[') {
        i++;
        return parseArray();
      }
      
      // Number
      if (/[\d-]/.test(str[i])) {
        let numStr = '';
        if (str[i] === '-') {
          numStr += str[i];
          i++;
        }
        while (i < str.length && /[\d.]/.test(str[i])) {
          numStr += str[i];
          i++;
        }
        return { type: 'number', value: parseFloat(numStr) };
      }
      
      // Boolean/null
      const remaining = str.substr(i);
      if (remaining.match(/^true\b/i)) {
        i += 4;
        return { type: 'boolean', value: true };
      }
      if (remaining.match(/^false\b/i)) {
        i += 5;
        return { type: 'boolean', value: false };
      }
      if (remaining.match(/^null\b/i)) {
        i += 4;
        return { type: 'null', value: null };
      }
      
      return null;
    };
    
    const parseArray = () => {
      skipWhitespace();
      if (str[i] === '[' || str[i] === '(') {
        i++;
        skipWhitespace();
      }
      const isObject = str.substr(i).match(/^\s*['"]/);
      const result = isObject ? {} : [];
      let hasElements = false;
      
      while (i < str.length) {
        skipWhitespace();
        if (str[i] === ']' || str[i] === ')') {
          i++;
          break;
        }
        if (str[i] === ',') {
          i++;
          continue;
        }
        
        // Parse key (for objects)
        let key = null;
        if (isObject) {
          const keyValue = parseValue();
          if (!keyValue) break;
          skipWhitespace();
          if (str.substr(i, 2) === '=>') {
            i += 2;
            key = keyValue.value;
          } else {
            // Numeric key
            if (keyValue.type === 'number') {
              key = keyValue.value;
              skipWhitespace();
              if (str.substr(i, 2) === '=>') {
                i += 2;
              } else {
                // It's actually a value, not a key
                if (hasElements) result.push(keyValue.value);
                else return keyValue.value;
                hasElements = true;
                continue;
              }
            } else {
              // No key, it's a value
              if (hasElements) result.push(convertToJson(keyValue));
              else return convertToJson(keyValue);
              hasElements = true;
              continue;
            }
          }
        }
        
        // Parse value
        const value = parseValue();
        if (!value) break;
        
        const jsonValue = convertToJson(value);
        if (isObject && key !== null) {
          result[key] = jsonValue;
        } else {
          result.push(jsonValue);
        }
        hasElements = true;
        
        skipWhitespace();
        if (str[i] === ',' || str[i] === ']' || str[i] === ')') {
          if (str[i] === ',') i++;
          if (str[i] === ']' || str[i] === ')') {
            i++;
            break;
          }
        }
      }
      
      return result;
    };
    
    const convertToJson = (value) => {
      if (!value) return null;
      if (value.type === 'string') {
        // Escape for JSON
        const escaped = value.value
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return escaped;
      }
      if (value.type === 'number') return value.value;
      if (value.type === 'boolean') return value.value;
      if (value.type === 'null') return null;
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') return value;
      return value;
    };
    
    // Check if we need to parse an array or a value
    skipWhitespace();
    if (i < str.length && (str[i] === '[' || str.substr(i, 5).match(/^array\s*\(/i))) {
      return parseArray();
    }
    // Otherwise parse as a single value
    return parseValue();
  };
  
  const parsed = parsePhpArray(phpStr);
  return JSON.stringify(parsed, null, 4);
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

  // Read the file
  var phpRead = fs.readFileSync(filePath, 'utf8');

  try {
    // Extract PHP array from file content
    let phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[/);
    if (!phpArrayMatch) {
      phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*array\s*\(/);
    }
    
    if (!phpArrayMatch) {
      return ReE(res, 'I ❤️ JSON. But you have entered invalid PHP array.');
    }
    
    // Extract the array content
    let arrayStart = phpRead.indexOf('[', phpArrayMatch.index);
    let isArraySyntax = true;
    if (arrayStart === -1) {
      arrayStart = phpRead.indexOf('array(', phpArrayMatch.index);
      if (arrayStart !== -1) {
        arrayStart += 5; // Skip 'array'
        isArraySyntax = false;
      }
    }
    
    if (arrayStart === -1) {
      return ReE(res, 'I ❤️ JSON. But you have entered invalid PHP array.');
    }
    
    // Find matching closing bracket
    let depth = 0;
    let inString = false;
    let stringChar = null;
    let arrayEnd = arrayStart;
    const openChar = isArraySyntax ? '[' : '(';
    const closeChar = isArraySyntax ? ']' : ')';
    
    for (let i = arrayStart; i < phpRead.length; i++) {
      const char = phpRead[i];
      const prevChar = i > 0 ? phpRead[i - 1] : '';
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        if (char === openChar || char === '[' || char === '(') {
          depth++;
        } else if (char === closeChar || char === ']' || char === ')') {
          depth--;
          if (depth === 0) {
            arrayEnd = i + 1;
            break;
          }
        }
      }
    }
    
    const arrayContent = phpRead.substring(arrayStart, arrayEnd);
    
    // Convert PHP to JSON
    const jsonContent = phpToJson(arrayContent);
    
    if (!!jsonContent) {
      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.json`;
      fs.writeFileSync(filePath, jsonContent, 'utf8');

      let toPath = filePath.replace('public/', '');

      return ReS(res, {
        message: 'I ❤️ JSON. PHP to JSON Conversion Successful.',
        data: `/${toPath}`
      });
    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid PHP.');
  }
}

