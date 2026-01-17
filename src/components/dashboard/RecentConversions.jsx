import Link from 'next/link';

const RecentConversions = ({ conversions }) => {
  if (!conversions || conversions.length === 0) {
    return (
      <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6 text-center">
        <p className="text-gray-500 dark:text-dark-muted">No conversions yet</p>
        <Link href="/" className="text-blue-500 hover:text-blue-600 mt-2 inline-block">
          Start converting
        </Link>
      </div>
    );
  }

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    return d.toLocaleDateString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border overflow-hidden">
      <div className="px-4 py-3 border-b dark:border-dark-border bg-gray-50 dark:bg-dark-border/50">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Recent Conversions</h3>
      </div>
      <div className="divide-y dark:divide-dark-border">
        {conversions.map((conversion) => (
          <div key={conversion.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-border/30">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                {conversion.fileName || 'Untitled'}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">
                {conversion.tool} • {formatBytes(conversion.inputSize)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-dark-muted whitespace-nowrap ml-4">
              {formatDate(conversion.createdAt)}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t dark:border-dark-border bg-gray-50 dark:bg-dark-border/50">
        <Link href="/dashboard/history" className="text-sm text-blue-500 hover:text-blue-600">
          View all history →
        </Link>
      </div>
    </div>
  );
};

export default RecentConversions;
