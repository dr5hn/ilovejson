import { useSession, signIn } from 'next-auth/react';

const AuthButton = () => {
  const { data: session, status } = useSession();

  // Don't render anything while loading to prevent hydration issues
  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-border animate-pulse" />
    );
  }

  if (session) {
    // User is signed in - return null here, UserMenu will handle the display
    return null;
  }

  // Not signed in
  return (
    <button
      onClick={() => signIn()}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-border/80 rounded-lg transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      Sign In
    </button>
  );
};

export default AuthButton;
