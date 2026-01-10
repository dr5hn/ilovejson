/**
 * Skeleton loader for placeholder content
 */
export const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-dark-border rounded ${className}`} />
);

/**
 * Progress indicator bar
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} stage - Current stage label
 */
export const ProgressIndicator = ({ progress = 0, stage = '' }) => (
  <div className="w-full max-w-md mx-auto">
    <div className="flex justify-between mb-1 text-sm">
      <span className="text-gray-700 dark:text-dark-text">{stage}</span>
      <span className="text-gray-600 dark:text-dark-muted">{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
      <div
        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

/**
 * Conversion loader with spinner and message
 * @param {string} message - Loading message to display
 * @param {number} progress - Optional progress percentage
 * @param {string} stage - Current stage (upload, processing, etc.)
 */
export const ConversionLoader = ({ message = 'Converting...', progress, stage }) => (
  <div className="flex flex-col items-center justify-center p-6">
    {progress !== undefined ? (
      <ProgressIndicator progress={progress} stage={stage || message} />
    ) : (
      <>
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 dark:border-dark-border h-12 w-12 mb-4"
             style={{ borderTopColor: '#3b82f6' }} />
        <p className="text-gray-600 dark:text-dark-muted text-center">{message}</p>
      </>
    )}
  </div>
);

/**
 * Large file warning indicator
 * @param {number} sizeMB - File size in MB
 */
export const LargeFileIndicator = ({ sizeMB }) => (
  <div className="mt-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md inline-flex items-center text-sm">
    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="text-yellow-700 dark:text-yellow-300">
      Large file ({sizeMB.toFixed(1)}MB) - upload may take longer
    </span>
  </div>
);
