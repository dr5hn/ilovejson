import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { parseFile } from '@middleware/fileParser';
import { errorHandler } from '@middleware/errorHandler';
const convert = require('xml-js');

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/xmltojson';
const downloadDir = globals.downloadDir + '/xmltojson';

export const config = {
  api: {
    bodyParser: false,
  },
};

const jsonOptions = {
  ignoreComment: true,
  alwaysChildren: true,
  compact: true,
  spaces: 4
};

// Helper function to simplify xml-js output structure
// Converts { _text: value } to just value, removes _declaration, root, and item wrappers
function simplifyXmlJson(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's an array, process each element
  if (Array.isArray(obj)) {
    return obj.map(item => simplifyXmlJson(item));
  }

  // If it's not an object, return as is
  if (typeof obj !== 'object') {
    return obj;
  }

  const keys = Object.keys(obj);
  
  // Remove _declaration property (XML declaration)
  if (keys.includes('_declaration')) {
    // Continue processing without _declaration
  }
  
  // If object has only _text property, return the value directly
  if (keys.length === 1 && keys[0] === '_text') {
    return simplifyXmlJson(obj._text);
  }

  // Process all properties recursively
  const simplified = {};
  for (const key in obj) {
    // Skip _declaration
    if (key === '_declaration') {
      continue;
    }
    // Skip root wrapper - unwrap its contents
    if (key === 'root') {
      const rootContent = simplifyXmlJson(obj.root);
      // If root contains item(s), unwrap them
      if (rootContent && typeof rootContent === 'object' && !Array.isArray(rootContent)) {
        if (rootContent.item) {
          const itemContent = simplifyXmlJson(rootContent.item);
          // If item is an array, return it directly; otherwise merge its properties
          if (Array.isArray(itemContent)) {
            return itemContent;
          } else if (typeof itemContent === 'object' && itemContent !== null) {
            // Merge item properties with any other root properties
            const otherProps = { ...rootContent };
            delete otherProps.item;
            return { ...otherProps, ...itemContent };
          } else {
            return itemContent;
          }
        }
      }
      // If root doesn't have item, return its content directly
      return rootContent;
    }
    // Skip item wrapper - unwrap its contents
    if (key === 'item') {
      const itemContent = simplifyXmlJson(obj.item);
      // If item is an array, return it directly
      if (Array.isArray(itemContent)) {
        return itemContent;
      }
      // Otherwise, merge item properties with other properties
      const itemObj = typeof itemContent === 'object' && itemContent !== null ? itemContent : {};
      Object.assign(simplified, itemObj);
      continue;
    }
    if (key === '_text') {
      // Skip _text for now, we'll handle it after processing other keys
      continue;
    } else if (key === '_attributes') {
      // Merge attributes into the simplified object
      if (obj._attributes && typeof obj._attributes === 'object') {
        Object.assign(simplified, obj._attributes);
      }
    } else {
      // Recursively process other properties
      simplified[key] = simplifyXmlJson(obj[key]);
    }
  }

  // Handle _text after processing other properties
  if (keys.includes('_text')) {
    const textValue = simplifyXmlJson(obj._text);
    // If there are no other properties (except possibly _attributes), use text value directly
    const hasOtherProps = keys.some(k => k !== '_text' && k !== '_attributes' && k !== '_declaration');
    if (!hasOtherProps) {
      // Only _text (and possibly _attributes), return text value
      return textValue;
    }
    // There are other properties, keep _text in the object
    simplified._text = textValue;
  }

  return simplified;
}

async function handler(req, res) {
  // Run all middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
    parseFile(uploadDir, { maxFileSize: 104857600 }), // 100MB
  ]);

  // Core conversion logic
  const xmlRead = fs.readFileSync(req.uploadedFile.path, 'utf8');

  // Convert XML to JSON
  const jsonString = convert.xml2json(xmlRead, jsonOptions);
  const jsonObj = JSON.parse(jsonString);

  // Simplify the structure (remove _text wrappers)
  const simplifiedJson = simplifyXmlJson(jsonObj);

  // Convert back to formatted JSON string
  const jsonContent = JSON.stringify(simplifiedJson, null, 4);

  const modifiedDate = new Date().getTime();
  const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
  fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

  const toPath = outputFilePath.replace('public/', '');

  return ReS(res, {
    message: 'I ❤️ JSON. XML to JSON Conversion Successful.',
    data: `/${toPath}`,
  });
}

export default errorHandler(handler);
