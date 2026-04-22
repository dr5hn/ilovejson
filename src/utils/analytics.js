// Fire-and-forget Umami analytics helpers.
// All functions are no-ops when NEXT_PUBLIC_UMAMI_WEBSITE_ID is not set (local dev).
// Analytics must never throw or break the calling code.

function track(name, data) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;
  try {
    window.umami?.track(name, data);
  } catch {
    // Intentionally swallowed — analytics must not affect the user experience
  }
}

/**
 * Fire after a successful file conversion.
 * @param {string} tool - slug e.g. 'json-to-csv'
 * @param {number} inputSizeBytes
 * @param {number} durationMs
 */
export function trackToolUsed(tool, inputSizeBytes, durationMs) {
  track('tool_used', { tool, inputSize: inputSizeBytes, durationMs });
}

/**
 * Fire after a failed conversion. Pass an error category, never the error message.
 * @param {string} tool
 * @param {'invalid_format'|'file_too_large'|'file_error'|'conversion_error'|'unknown'} errorType
 */
export function trackConversionFailed(tool, errorType) {
  track('conversion_failed', { tool, errorType });
}

/**
 * Fire when the user clicks the download button.
 * @param {string} tool
 */
export function trackDownload(tool) {
  track('download_file', { tool });
}

/**
 * Classify an error message into a safe, non-PII category string.
 * @param {string} message
 * @returns {'invalid_format'|'file_too_large'|'file_error'|'conversion_error'|'unknown'}
 */
export function classifyError(message) {
  if (!message) return 'unknown';
  const m = message.toLowerCase();
  if (m.includes('invalid')) return 'invalid_format';
  if (m.includes('large') || m.includes('size')) return 'file_too_large';
  if (m.includes('path') || m.includes('not found')) return 'file_error';
  return 'conversion_error';
}
