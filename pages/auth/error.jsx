import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@components/layout';

const errorMessages = {
  Configuration: 'There is a problem with the server configuration. Please try again later.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthSignin: 'Error occurred while trying to sign in with the provider.',
  OAuthCallback: 'Error occurred while handling the OAuth callback.',
  OAuthCreateAccount: 'Could not create user account with the OAuth provider.',
  EmailCreateAccount: 'Could not create user account with email.',
  Callback: 'Error occurred during the callback.',
  OAuthAccountNotLinked: 'This email is already associated with another account. Please sign in with that account instead.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An unexpected error occurred. Please try again.',
};

const AuthError = () => {
  const router = useRouter();
  const { error } = router.query;
  
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <Layout title="Authentication Error" description="An error occurred during authentication">
      <div className="app mt-5 w-full h-full p-8 font-sans flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md">
          <div className="box border rounded flex flex-col shadow bg-white dark:bg-dark-surface dark:border-dark-border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 dark:text-dark-muted mb-6">
              {errorMessage}
            </p>
            {error && (
              <p className="text-sm text-gray-400 dark:text-dark-muted mb-6 font-mono">
                Error code: {error}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded shadow transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-dark-border/80 text-gray-700 dark:text-dark-text font-semibold py-2 px-6 rounded shadow transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthError;
