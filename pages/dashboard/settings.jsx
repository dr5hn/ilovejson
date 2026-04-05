import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { signOut } from 'next-auth/react';
import DashboardLayout from '@components/dashboard/DashboardLayout';

const Settings = ({ user }) => {
  return (
    <DashboardLayout title="Settings" description="Manage your account settings">
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-4">Profile</h3>
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'Profile'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center text-2xl font-medium text-gray-600 dark:text-dark-muted">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-dark-text">{user.name || 'User'}</p>
              <p className="text-sm text-gray-500 dark:text-dark-muted">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-4">Connected Accounts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border dark:border-dark-border rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-gray-900 dark:text-dark-text">Google</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="box border rounded shadow bg-white dark:bg-dark-surface dark:border-dark-border p-6">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-4">Preferences</h3>
          <p className="text-sm text-gray-500 dark:text-dark-muted">
            Theme preferences are saved in your browser. Use the toggle in the header to switch between light and dark mode.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="box border border-red-200 dark:border-red-900/50 rounded shadow bg-red-50 dark:bg-red-900/10 p-6">
          <h3 className="font-medium text-red-700 dark:text-red-400 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">Sign out</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">Sign out of your account on this device</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
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

  return {
    props: {
      user: {
        name: session.user.name || null,
        email: session.user.email || null,
        image: session.user.image || null,
      },
    },
  };
}

export default Settings;
