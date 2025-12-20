import { IncomingForm } from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReE, ReS } from '@utils/reusables';
const convert = require('xml-js');

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/xmltojson';
const downloadDir = globals.downloadDir + '/xmltojson';

export const config = {
  api: {
    bodyParser: false,
  },
}

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
  var xmlRead = fs.readFileSync(filePath, 'utf8');

  try {
    // Convert it to XML -> Json
    var jsonString = convert.xml2json(xmlRead, jsonOptions);
    
    // Parse the JSON string
    var jsonObj = JSON.parse(jsonString);
    
    // Simplify the structure (remove _text wrappers)
    var simplifiedJson = simplifyXmlJson(jsonObj);
    
    // Convert back to formatted JSON string
    var jsonContent = JSON.stringify(simplifiedJson, null, 4);

    // Is it converted?
    if (!!jsonContent) {
      const modifiedDate = new Date().getTime();
      const filePath = `${downloadDir}/${modifiedDate}.json`;
      fs.writeFileSync(filePath, jsonContent, 'utf8');

      let toPath = filePath.replace('public/', '');

      // Parsed
      return ReS(res, {
        message: 'I ❤️ JSON. XML to JSON Conversion Successful.',
        data: `/${toPath}`
      });

    }
  } catch (e) {
    return ReE(res, 'I ❤️ JSON. But you have entered invalid XML.');
  }

}
