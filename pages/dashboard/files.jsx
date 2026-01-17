import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import SavedFilesList from '@components/dashboard/SavedFilesList';
import prisma from '@lib/prisma';

const Files = ({ files }) => {
  return (
    <DashboardLayout title="Saved Files" description="Manage your saved files">
      <div className="space-y-6">
        {/* Pro feature notice */}
        <div className="box border rounded shadow bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-dark-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-dark-text">Pro Feature</h3>
              <p className="text-sm text-gray-600 dark:text-dark-muted mt-1">
                Save your converted files for up to 7 days with a Pro subscription. 
                Free users can download files immediately after conversion.
              </p>
              <button className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* Files list */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-4">Your Saved Files</h3>
          <SavedFilesList files={files} />
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
    const files = await prisma.savedFile.findMany({
      where: { 
        userId: session.user.id,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      props: {
        files: JSON.parse(JSON.stringify(files)),
      },
    };
  } catch (error) {
    console.error('Files error:', error);
    return {
      props: {
        files: [],
      },
    };
  }
}

export default Files;
