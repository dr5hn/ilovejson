import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import StatsCards from '@components/dashboard/StatsCards';
import RecentConversions from '@components/dashboard/RecentConversions';
import prisma from '@lib/prisma';

const Dashboard = ({ stats, recentConversions }) => {
  return (
    <DashboardLayout title="Dashboard" description="Your conversion dashboard">
      <div className="space-y-6">
        <StatsCards stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentConversions conversions={recentConversions} />
          
          <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6">
            <h3 className="font-medium text-gray-900 dark:text-dark-text mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/json-to-csv" className="flex items-center gap-2 p-3 rounded-lg border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                <span className="text-sm text-gray-700 dark:text-dark-text">JSON → CSV</span>
              </a>
              <a href="/json-to-yaml" className="flex items-center gap-2 p-3 rounded-lg border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                <span className="text-sm text-gray-700 dark:text-dark-text">JSON → YAML</span>
              </a>
              <a href="/diff" className="flex items-center gap-2 p-3 rounded-lg border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                <span className="text-sm text-gray-700 dark:text-dark-text">JSON Diff</span>
              </a>
              <a href="/merge" className="flex items-center gap-2 p-3 rounded-lg border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                <span className="text-sm text-gray-700 dark:text-dark-text">JSON Merge</span>
              </a>
            </div>
          </div>
        </div>
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
    // Get user stats
    const conversions = await prisma.conversion.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalConversions = await prisma.conversion.count({
      where: { userId: session.user.id },
    });

    const dataProcessedResult = await prisma.conversion.aggregate({
      where: { userId: session.user.id },
      _sum: { inputSize: true },
    });

    // Get top tool
    const topToolResult = await prisma.conversion.groupBy({
      by: ['tool'],
      where: { userId: session.user.id },
      _count: { tool: true },
      orderBy: { _count: { tool: 'desc' } },
      take: 1,
    });

    const stats = {
      totalConversions,
      dataProcessed: dataProcessedResult._sum.inputSize || 0,
      topTool: topToolResult[0]?.tool || 'N/A',
      accountType: 'Free',
    };

    return {
      props: {
        stats,
        recentConversions: JSON.parse(JSON.stringify(conversions)),
      },
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      props: {
        stats: {
          totalConversions: 0,
          dataProcessed: 0,
          topTool: 'N/A',
          accountType: 'Free',
        },
        recentConversions: [],
      },
    };
  }
}

export default Dashboard;
