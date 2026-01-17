import { useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import prisma from '@lib/prisma';

const History = ({ initialConversions, totalCount }) => {
  const [conversions] = useState(initialConversions);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const totalPages = Math.ceil(totalCount / perPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTool = (tool) => {
    return tool.replace(/([a-z])to([a-z])/i, '$1 → $2').toUpperCase();
  };

  return (
    <DashboardLayout title="Conversion History" description="View all your past conversions">
      <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-dark-border bg-gray-50 dark:bg-dark-border/50 flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">
            All Conversions ({totalCount})
          </h3>
        </div>

        {conversions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-dark-muted">No conversion history yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-border/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">File</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Tool</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Input Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Output Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-dark-border">
                  {conversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50 dark:hover:bg-dark-border/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text">
                        {conversion.fileName || 'Untitled'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                        {formatTool(conversion.tool)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                        {formatBytes(conversion.inputSize)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                        {formatBytes(conversion.outputSize)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-dark-muted">
                        {formatDate(conversion.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t dark:border-dark-border bg-gray-50 dark:bg-dark-border/50 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-dark-muted">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-dark-border dark:text-dark-text"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-dark-border dark:text-dark-text"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  try {
    const conversions = await prisma.conversion.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalCount = await prisma.conversion.count({
      where: { userId: session.user.id },
    });

    return {
      props: {
        initialConversions: JSON.parse(JSON.stringify(conversions)),
        totalCount,
      },
    };
  } catch (error) {
    console.error('History error:', error);
    return {
      props: {
        initialConversions: [],
        totalCount: 0,
      },
    };
  }
}

export default History;
