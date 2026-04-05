import { signOut } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import Layout from '@components/layout';

const SignOut = () => {
  return (
    <Layout title="Sign Out" description="Sign out of iLoveJSON">
      <div className="app mt-5 w-full h-full p-8 font-sans flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md">
          <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">
              Sign Out
            </h1>
            <p className="text-gray-600 dark:text-dark-muted mb-8">
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded shadow transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-dark-border/80 text-gray-700 dark:text-dark-text font-semibold py-2 px-6 rounded shadow transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If not signed in, redirect to home
  if (!session) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
}

export default SignOut;
