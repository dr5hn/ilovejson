import { useState } from 'react'
import Link from 'next/link'
import { signIn, getProviders } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/auth'

export default function SignIn({ providers }) {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const result = await signIn('email', { email, redirect: false, callbackUrl: '/dashboard' })
    setLoading(false)
    if (result?.ok) {
      setEmailSent(true)
    }
  }

  const hasEmail = providers?.email
  const hasGoogle = providers?.google
  const hasGithub = providers?.github

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/images/logo.png" alt="ilovejson" width="64" className="mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to ilovejson</h1>
          <p className="text-gray-500 mt-2 text-sm">Save your conversion results and access them anytime</p>
        </div>

        {emailSent ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-5xl mb-4">✉️</div>
            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
            <p className="text-gray-500 mt-2 text-sm">
              A sign-in link has been sent to <strong>{email}</strong>. It expires in 10 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasEmail && (
              <form onSubmit={handleEmailSignIn}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>
            )}

            {(hasGoogle || hasGithub) && hasEmail && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                  or continue with
                </div>
              </div>
            )}

            {hasGoogle && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}

            {hasGithub && (
              <button
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (session) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  const rawProviders = await getProviders()
  // Only expose providers that are enabled
  const providers = rawProviders
    ? Object.fromEntries(
        Object.entries(rawProviders).filter(([id]) =>
          ['email', 'google', 'github'].includes(id)
        )
      )
    : {}

  return { props: { providers } }
}
