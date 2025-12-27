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

const uploadDir = globals.uploadDir + '/phptojson';
const downloadDir = globals.downloadDir + '/phptojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic
  const phpRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  // Extract PHP array from file content
  let phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[/);
  if (!phpArrayMatch) {
    phpArrayMatch = phpRead.match(/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*array\s*\(/);
  }

  if (!phpArrayMatch) {
    throw new Error('I ❤️ JSON. But you have entered invalid PHP array.');
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
    throw new Error('I ❤️ JSON. But you have entered invalid PHP array.');
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

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. PHP to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);

