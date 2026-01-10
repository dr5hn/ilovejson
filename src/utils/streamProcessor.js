const fs = require('fs');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

// File size thresholds
const STREAMING_THRESHOLD = 10 * 1024 * 1024; // 10MB
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

/**
 * Process a file with automatic detection of optimal method
 * Uses synchronous for small files (<10MB) and streaming for large files
 *
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output file
 * @param {Function} transformFn - Function to transform content (receives string, returns string)
 * @param {Object} options - Processing options
 * @param {number} options.threshold - Size threshold for streaming (default: 10MB)
 * @returns {Promise<{method: string, inputSize: number, outputSize: number}>}
 */
async function processLargeFile(inputPath, outputPath, transformFn, options = {}) {
  const threshold = options.threshold || STREAMING_THRESHOLD;
  const stats = fs.statSync(inputPath);
  const inputSize = stats.size;

  if (inputSize < threshold) {
    // Small file: use synchronous processing (faster)
    return processSync(inputPath, outputPath, transformFn);
  } else {
    // Large file: use chunked reading with full content transform
    // Note: Most JSON transformations need the full content, so we read in chunks
    // but process all at once. True streaming is only possible for line-based formats.
    return processLargeSync(inputPath, outputPath, transformFn);
  }
}

/**
 * Synchronous processing for small files
 */
function processSync(inputPath, outputPath, transformFn) {
  const content = fs.readFileSync(inputPath, 'utf8');
  const transformed = transformFn(content);
  fs.writeFileSync(outputPath, transformed, 'utf8');

  return {
    method: 'sync',
    inputSize: Buffer.byteLength(content, 'utf8'),
    outputSize: Buffer.byteLength(transformed, 'utf8')
  };
}

/**
 * Process large files by reading in chunks but transforming all at once
 * More memory efficient than readFileSync for very large files
 */
async function processLargeSync(inputPath, outputPath, transformFn) {
  // Read file in chunks to avoid blocking event loop
  const chunks = [];
  const readStream = fs.createReadStream(inputPath, {
    encoding: 'utf8',
    highWaterMark: CHUNK_SIZE
  });

  for await (const chunk of readStream) {
    chunks.push(chunk);
  }

  const content = chunks.join('');
  const transformed = transformFn(content);

  // Write in chunks for large output
  await writeInChunks(outputPath, transformed);

  return {
    method: 'chunked',
    inputSize: Buffer.byteLength(content, 'utf8'),
    outputSize: Buffer.byteLength(transformed, 'utf8')
  };
}

/**
 * Write content in chunks to avoid blocking
 */
async function writeInChunks(outputPath, content) {
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

  return new Promise((resolve, reject) => {
    let offset = 0;

    function writeChunk() {
      let ok = true;
      while (ok && offset < content.length) {
        const chunk = content.slice(offset, offset + CHUNK_SIZE);
        offset += CHUNK_SIZE;

        if (offset >= content.length) {
          // Last chunk
          writeStream.end(chunk, resolve);
        } else {
          ok = writeStream.write(chunk);
        }
      }

      if (offset < content.length) {
        writeStream.once('drain', writeChunk);
      }
    }

    writeStream.on('error', reject);
    writeChunk();
  });
}

/**
 * Stream-based line processing for line-based formats (CSV, NDJSON)
 * Only use this for formats where each line can be processed independently
 */
async function processLineByLine(inputPath, outputPath, lineTransformFn) {
  const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

  let buffer = '';
  let lineNumber = 0;
  let inputSize = 0;
  let outputSize = 0;

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      inputSize += chunk.length;
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        const transformed = lineTransformFn(line, lineNumber++) + '\n';
        outputSize += transformed.length;
        this.push(transformed);
      }
      callback();
    },
    flush(callback) {
      if (buffer) {
        const transformed = lineTransformFn(buffer, lineNumber);
        outputSize += transformed.length;
        this.push(transformed);
      }
      callback();
    }
  });

  await pipeline(readStream, transformStream, writeStream);

  return {
    method: 'streaming',
    inputSize,
    outputSize,
    linesProcessed: lineNumber
  };
}

/**
 * Get file size in a human-readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Check if file size is within allowed limits
 */
function validateFileSize(filePath, maxSize) {
  const stats = fs.statSync(filePath);
  if (stats.size > maxSize) {
    const error = new Error(`File size (${formatFileSize(stats.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
    error.code = 'FILE_TOO_LARGE';
    error.fileSize = stats.size;
    error.maxSize = maxSize;
    throw error;
  }
  return stats.size;
}

module.exports = {
  processLargeFile,
  processSync,
  processLargeSync,
  processLineByLine,
  writeInChunks,
  formatFileSize,
  validateFileSize,
  STREAMING_THRESHOLD,
  CHUNK_SIZE
};
