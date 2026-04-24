/**
 * File Parser Middleware
 *
 * Centralizes Formidable file parsing logic.
 * Handles file uploads, validation, and attaches file info to request.
 */

import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import { ReE } from '@utils/reusables';
import { resolveUserTier } from '@lib/resolveUserTier';
import { TIER_BATCH_LIMITS } from '@constants/limits';

/**
 * Create a file parsing middleware with Formidable.
 * @param {string} uploadDir - Directory to upload files to
 * @param {Object} options
 * @param {number}  options.maxFileSize  - Max file size in bytes (default 100 MB)
 * @param {boolean} options.tieredBatch  - When true, enforce per-tier batch file limits
 * @returns {Function} Middleware function
 */
export const parseFile = (uploadDir, options = {}) => {
  const maxFileSize = options.maxFileSize || 104857600; // 100 MB default
  const tieredBatch = options.tieredBatch || false;

  return async (req, res, next) => {
    // Resolve tier before parsing so we know the maxFiles limit
    // (toolsLimit middleware may have already resolved it and set req.userTier)
    let maxFiles = 1;
    if (tieredBatch) {
      if (!req.userTier) {
        const tier = await resolveUserTier(req, res);
        req.userTier = tier;
      }
      maxFiles = TIER_BATCH_LIMITS[req.userTier] ?? 1;
    }

    // Honour tier-based file size cap set by toolsLimit middleware
    const effectiveMaxFileSize = req.toolsFileSizeLimit ?? maxFileSize;

    try {
      const data = await new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.uploadDir = uploadDir;
        form.keepExtensions = true;
        form.maxFileSize = effectiveMaxFileSize;
        form.multiples = maxFiles > 1;
        form.maxFieldsSize = maxFileSize;

        form.parse(req, (err, fields, files) => {
          if (err) {
            if (err.code === 'LIMIT_FILE_SIZE' || err.message.includes('maxFileSize')) {
              const limitMB = Math.floor(effectiveMaxFileSize / 1048576);
              const msg = req.userTier === 'FREE'
                ? `File exceeds the 5 MB limit for the Free plan. Upgrade to Pro for larger files.`
                : `File size exceeds ${limitMB} MB limit`;
              return reject(new Error(msg));
            }
            return reject(err);
          }
          resolve({ fields, files });
        });
      });

      // Validate at least one file was sent
      if (!(data.files && data.files.fileInfo)) {
        return ReE(res, 'I ❤️ JSON. But you forgot to bring something to me.', 400);
      }

      const fileInfo = data.files.fileInfo;
      // Normalise to array (Formidable v2 returns object, v3+ returns array)
      const fileList = Array.isArray(fileInfo) ? fileInfo : [fileInfo];

      // Enforce tier batch limit — cleanup already-uploaded files then reject
      if (tieredBatch && fileList.length > maxFiles) {
        for (const f of fileList) {
          const p = f.filepath || f.path;
          if (p) try { fs.unlinkSync(p); } catch { /* ignore */ }
        }
        const tierLabel = req.userTier || 'FREE';
        const limitLabel = maxFiles === Infinity ? 'unlimited' : maxFiles;
        return ReE(
          res,
          `Your ${tierLabel} plan allows ${limitLabel} file${maxFiles === 1 ? '' : 's'} per request. ` +
          `You sent ${fileList.length}. Upgrade your plan to process more files at once.`,
          403,
        );
      }

      // Take only the first file for single-file routes (maxFiles === 1)
      const firstFile = fileList[0];
      const filePath = firstFile.filepath || firstFile.path;
      const fileSize = firstFile.size || 0;

      if (!filePath) {
        return ReE(res, "I ❤️ JSON. But I couldn't find the file path.", 400);
      }

      // Prevent path traversal
      const resolvedUploadDir = path.resolve(uploadDir);
      const resolvedFilePath = path.resolve(filePath);
      if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep) && resolvedFilePath !== resolvedUploadDir) {
        return ReE(res, 'Invalid file path.', 400);
      }

      req.uploadedFile = { path: filePath, size: fileSize, fields: data.fields };
      // Also expose full list for routes that process multiple files
      req.uploadedFiles = fileList.map(f => ({
        path: f.filepath || f.path,
        size: f.size || 0,
        name: f.originalFilename || f.name || '',
      }));

      next();
    } catch (error) {
      return ReE(res, error.message || 'File upload failed', 400);
    }
  };
};
