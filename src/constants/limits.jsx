/**
 * Per-tool file size limits and batch processing limits.
 *
 * maxFileSize: maximum upload size in bytes
 * maxFiles:    maximum number of files per request
 *
 * Tools not listed here use the defaults.
 */

const MB = 1048576;

const defaults = {
  maxFileSize: 25 * MB,    // 25MB default for most tools
  maxFiles: 1,
};

// Per-tool overrides — keyed by API route name (slug without dashes)
const toolOverrides = {
  // Text-based conversions — lightweight, allow larger files
  jsontocsv:        { maxFileSize: 100 * MB },
  csvtojson:        { maxFileSize: 100 * MB },
  jsontoyaml:       { maxFileSize: 50 * MB },
  yamltojson:       { maxFileSize: 50 * MB },
  jsontoxml:        { maxFileSize: 50 * MB },
  xmltojson:        { maxFileSize: 50 * MB },
  jsontotoml:       { maxFileSize: 25 * MB },
  tomltojson:       { maxFileSize: 25 * MB },

  // Code generation — smaller inputs typical
  jsontotypescript: { maxFileSize: 10 * MB },
  typescripttojson: { maxFileSize: 10 * MB },
  jsontosql:        { maxFileSize: 50 * MB },
  sqltojson:        { maxFileSize: 50 * MB },
  jsontophp:        { maxFileSize: 25 * MB },
  phptojson:        { maxFileSize: 25 * MB },

  // Document formats
  jsontomarkdown:   { maxFileSize: 25 * MB },
  markdowntojson:   { maxFileSize: 25 * MB },
  jsontohtml:       { maxFileSize: 25 * MB },
  htmltojson:       { maxFileSize: 25 * MB },

  // Excel — binary format, heavier processing
  jsontoexcel:      { maxFileSize: 50 * MB },
  exceltojson:      { maxFileSize: 50 * MB },

  // Multi-file tools
  jsondiff:         { maxFileSize: 25 * MB, maxFiles: 2 },
  jsonmerge:        { maxFileSize: 25 * MB, maxFiles: 10 },

  // Query — may need large files
  jsonquery:        { maxFileSize: 100 * MB },

  // Faker — no file upload, just JSON body
  jsonfaker:        { maxFileSize: 1 * MB },
};

/**
 * Get limits for a specific tool.
 * @param {string} toolKey - API route name (e.g., 'jsontocsv') or slug (e.g., 'json-to-csv')
 * @returns {{ maxFileSize: number, maxFiles: number }}
 */
export function getToolLimits(toolKey) {
  // Normalize: slug 'json-to-csv' → 'jsontocsv'
  const key = toolKey.replace(/-/g, '');
  const overrides = toolOverrides[key] || {};
  return { ...defaults, ...overrides };
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes >= MB) return `${Math.round(bytes / MB)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export { defaults as defaultLimits };

/**
 * Maximum files per request per subscription tier.
 * FREE = 1 file (anyone, anonymous or free account)
 * PRO  = 10 files per request
 * BUSINESS = unlimited (represented as Infinity)
 */
export const TIER_BATCH_LIMITS = {
  FREE: 1,
  PRO: 10,
  BUSINESS: Infinity,
};
