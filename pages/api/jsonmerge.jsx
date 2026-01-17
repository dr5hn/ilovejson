import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { errorHandler } from '@middleware/errorHandler';
import formidable from 'formidable';

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsonmerge';
const downloadDir = globals.downloadDir + '/jsonmerge';

export const config = {
  api: {
    bodyParser: false,
  },
};

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(strategy, target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(strategy, target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        if (strategy === 'concat') {
          target[key] = Array.isArray(target[key])
            ? [...target[key], ...source[key]]
            : source[key];
        } else if (strategy === 'unique') {
          const existing = Array.isArray(target[key]) ? target[key] : [];
          target[key] = [...new Set([...existing, ...source[key]])];
        } else {
          target[key] = source[key];
        }
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(strategy, target, ...sources);
}

async function handler(req, res) {
  // Run middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 20, windowMs: 60000 }),
  ]);

  // Parse multiple files
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 104857600, // 100MB
    multiples: true,
  });

  const [fields, files] = await form.parse(req);

  // Get merge strategy from fields
  const strategyArray = fields.strategy || [];
  const strategy = strategyArray[0] || 'deep';

  // Get all uploaded files
  const uploadedFiles = files.files || [];

  if (uploadedFiles.length < 2) {
    return ReE(res, 'At least 2 files are required for merging', 400);
  }

  if (uploadedFiles.length > 10) {
    return ReE(res, 'Maximum 10 files can be merged at once', 400);
  }

  try {
    // Read and parse all JSON files
    const jsonObjects = [];
    for (const file of uploadedFiles) {
      const content = fs.readFileSync(file.filepath, 'utf8');
      const parsed = JSON.parse(content);
      jsonObjects.push(parsed);
    }

    // Merge all objects
    let merged;
    if (strategy === 'shallow') {
      merged = Object.assign({}, ...jsonObjects);
    } else {
      merged = deepMerge(strategy, {}, ...jsonObjects);
    }

    // Save merged result
    const modifiedDate = new Date().getTime();
    const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
    fs.writeFileSync(outputFilePath, JSON.stringify(merged, null, 2), 'utf8');

    // Cleanup uploaded files
    for (const file of uploadedFiles) {
      fs.unlinkSync(file.filepath);
    }

    const toPath = outputFilePath.replace('public/', '');

    return ReS(res, {
      message: `Successfully merged ${uploadedFiles.length} files using ${strategy} strategy.`,
      data: `/${toPath}`,
      fileCount: uploadedFiles.length,
      strategy,
    });
  } catch (error) {
    // Cleanup files on error
    try {
      for (const file of uploadedFiles) {
        if (file?.filepath) fs.unlinkSync(file.filepath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export default errorHandler(handler);
