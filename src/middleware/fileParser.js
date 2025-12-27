/**
 * File Parser Middleware
 *
 * Centralizes Formidable file parsing logic.
 * Handles file uploads, validation, and attaches file info to request.
 */

import { IncomingForm } from 'formidable';
import { ReE } from '@utils/reusables';

/**
 * Create a file parsing middleware with Formidable
 * @param {string} uploadDir - Directory to upload files to
 * @param {Object} options - Configuration options
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 100MB)
 * @returns {Function} Middleware function
 */
export const parseFile = (uploadDir, options = {}) => {
  const maxFileSize = options.maxFileSize || 104857600; // 100MB default

  return async (req, res, next) => {
    try {
      const data = await new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.uploadDir = uploadDir;
        form.keepExtensions = true;
        form.maxFileSize = maxFileSize;
        form.multiples = false;

        // Increase memory limits for large files
        form.maxFieldsSize = maxFileSize;

        form.parse(req, async (err, fields, files) => {
          if (err) {
            // Handle specific Formidable errors
            if (err.code === 'LIMIT_FILE_SIZE' || err.message.includes('maxFileSize')) {
              return reject(new Error(`File size exceeds ${Math.floor(maxFileSize / 1048576)}MB limit`));
            }
            return reject(err);
          }
          resolve({ fields, files });
        });
      });

      // Validate file exists
      if (!(data.files && data.files.fileInfo)) {
        return ReE(res, 'I ❤️ JSON. But you forgot to bring something to me.', 400);
      }

      // Extract file path (handle array/object variations from different Formidable versions)
      const fileInfo = data.files.fileInfo;
      let filePath = null;
      let fileSize = 0;

      if (Array.isArray(fileInfo)) {
        // Formidable v3+ returns arrays
        const firstFile = fileInfo[0];
        filePath = firstFile.filepath || firstFile.path;
        fileSize = firstFile.size || 0;
      } else {
        // Formidable v2 returns objects
        filePath = fileInfo.filepath || fileInfo.path;
        fileSize = fileInfo.size || 0;
      }

      if (!filePath) {
        return ReE(res, 'I ❤️ JSON. But I couldn\'t find the file path.', 400);
      }

      // Attach file info to request for next middleware
      req.uploadedFile = {
        path: filePath,
        size: fileSize,
        fields: data.fields
      };

      next();
    } catch (error) {
      return ReE(res, error.message || 'File upload failed', 400);
    }
  };
};
