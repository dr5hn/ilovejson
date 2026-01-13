import { useState } from 'react';
import {
  useFileHistory,
  formatFileSize,
  formatTimestamp,
} from '@hooks/useFileHistory';

const FileHistory = () => {
  const { history, isLoaded, removeFromHistory, clearHistory } =
    useFileHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isLoaded || history.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-t-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-dark-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium text-gray-700 dark:text-dark-text">
            Recent Conversions
          </span>
          <span className="text-sm text-gray-500 dark:text-dark-muted">
            ({history.length})
          </span>
        </div>
        {isExpanded && (
          <button
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Clear all history?')) {
                clearHistory();
              }
            }}
          >
            Clear All
          </button>
        )}
      </button>

      {isExpanded && (
        <div className="border border-t-0 border-gray-200 dark:border-dark-border rounded-b-lg bg-white dark:bg-dark-surface overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-dark-border/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 dark:text-dark-text truncate max-w-xs">
                      {item.fileName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap">
                      {item.fromFormat} → {item.toFormat}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-muted mt-1">
                    <span>{formatTimestamp(item.timestamp)}</span>
                    {item.fileSize > 0 && (
                      <span>{formatFileSize(item.fileSize)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {item.downloadLink && (
                    <a
                      href={item.downloadLink}
                      download
                      className="text-sm px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  )}
                  <button
                    className="text-gray-400 hover:text-red-500 p-1"
                    onClick={() => removeFromHistory(item.id)}
                    title="Remove from history"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileHistory;
