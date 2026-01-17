const SavedFilesList = ({ files, onDelete }) => {
  if (!files || files.length === 0) {
    return (
      <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6 text-center">
        <p className="text-gray-500 dark:text-dark-muted">No saved files</p>
        <p className="text-sm text-gray-400 dark:text-dark-muted mt-1">
          Files you save will appear here (Pro feature)
        </p>
      </div>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getExpiryStatus = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { text: 'Expired', color: 'red' };
    if (diffDays <= 1) return { text: 'Expires today', color: 'yellow' };
    if (diffDays <= 3) return { text: 'Expires in ' + diffDays + ' days', color: 'yellow' };
    return { text: 'Expires in ' + diffDays + ' days', color: 'green' };
  };

  return (
    <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border overflow-hidden">
      <div className="divide-y dark:divide-dark-border">
        {files.map((file) => {
          const expiry = getExpiryStatus(file.expiresAt);
          return (
            <div key={file.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-border/30">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
                  {file.type.toUpperCase()} • {formatBytes(file.size)} • {formatDate(file.createdAt)}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                expiry.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                expiry.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                {expiry.text}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={file.path}
                  download
                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {onDelete && (
                  <button
                    onClick={() => onDelete(file.id)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedFilesList;
