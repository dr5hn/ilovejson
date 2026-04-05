import React, { useState } from 'react';

const DiffViewer = ({ differences, summary }) => {
  const [expandedPaths, setExpandedPaths] = useState({});

  if (!differences || differences.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
          Files are identical
        </h3>
        <p className="text-gray-600 dark:text-dark-muted">
          No differences found between the two JSON files.
        </p>
      </div>
    );
  }

  const getPathString = (path) => {
    if (!path || path.length === 0) return 'root';
    return path.join('.');
  };

  const getDiffTypeIcon = (kind) => {
    switch (kind) {
      case 'N': // New
        return <span className="text-green-600 dark:text-green-400 font-bold">+</span>;
      case 'D': // Deleted
        return <span className="text-red-600 dark:text-red-400 font-bold">-</span>;
      case 'E': // Edited
        return <span className="text-yellow-600 dark:text-yellow-400 font-bold">~</span>;
      case 'A': // Array
        return <span className="text-blue-600 dark:text-blue-400 font-bold">⋯</span>;
      default:
        return null;
    }
  };

  const getDiffTypeLabel = (kind) => {
    switch (kind) {
      case 'N': return 'Added';
      case 'D': return 'Removed';
      case 'E': return 'Modified';
      case 'A': return 'Array Changed';
      default: return 'Unknown';
    }
  };

  const formatValue = (value) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  };

  const togglePath = (index) => {
    setExpandedPaths(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border dark:border-dark-border rounded-lg bg-green-50 dark:bg-green-900/10">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.added}</div>
          <div className="text-sm text-gray-600 dark:text-dark-muted">Added</div>
        </div>
        <div className="p-4 border dark:border-dark-border rounded-lg bg-red-50 dark:bg-red-900/10">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.removed}</div>
          <div className="text-sm text-gray-600 dark:text-dark-muted">Removed</div>
        </div>
        <div className="p-4 border dark:border-dark-border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.modified}</div>
          <div className="text-sm text-gray-600 dark:text-dark-muted">Modified</div>
        </div>
        <div className="p-4 border dark:border-dark-border rounded-lg bg-blue-50 dark:bg-blue-900/10">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.arrayChanged}</div>
          <div className="text-sm text-gray-600 dark:text-dark-muted">Array Changes</div>
        </div>
      </div>

      {/* Differences List */}
      <div className="border dark:border-dark-border rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-dark-surface px-4 py-3 border-b dark:border-dark-border">
          <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text">
            Differences ({differences.length})
          </h3>
        </div>
        <div className="divide-y dark:divide-dark-border">
          {differences.map((diff, index) => {
            const isExpanded = expandedPaths[index];
            const pathStr = getPathString(diff.path);

            return (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => togglePath(index)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getDiffTypeIcon(diff.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-muted">
                        {getDiffTypeLabel(diff.kind)}
                      </span>
                      <code className="text-sm font-mono text-gray-900 dark:text-dark-text">
                        {pathStr}
                      </code>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-sm">
                        {diff.kind === 'E' && (
                          <>
                            <div>
                              <span className="text-red-600 dark:text-red-400 font-medium">- Old: </span>
                              <code className="text-gray-700 dark:text-dark-muted bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                {formatValue(diff.lhs)}
                              </code>
                            </div>
                            <div>
                              <span className="text-green-600 dark:text-green-400 font-medium">+ New: </span>
                              <code className="text-gray-700 dark:text-dark-muted bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                {formatValue(diff.rhs)}
                              </code>
                            </div>
                          </>
                        )}
                        {diff.kind === 'N' && (
                          <div>
                            <span className="text-green-600 dark:text-green-400 font-medium">+ Added: </span>
                            <code className="text-gray-700 dark:text-dark-muted bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                              {formatValue(diff.rhs)}
                            </code>
                          </div>
                        )}
                        {diff.kind === 'D' && (
                          <div>
                            <span className="text-red-600 dark:text-red-400 font-medium">- Removed: </span>
                            <code className="text-gray-700 dark:text-dark-muted bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                              {formatValue(diff.lhs)}
                            </code>
                          </div>
                        )}
                        {diff.kind === 'A' && (
                          <div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Array change at index {diff.index}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
