import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { utils } from '@constants/utils'

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative ml-4" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="User menu"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || 'User'} className="w-9 h-9 rounded-full border-2 border-transparent hover:border-indigo-400" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold border-2 border-transparent hover:border-indigo-400">
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Signed in'}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
          <Link href="/dashboard/files" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Saved Files</Link>
          <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

const Layout = ({ children, title, description }) => {
  const { data: session } = useSession()

  return (
    <div className="antialiased bg-gray-200 flex flex-col min-h-screen">
      <header className="lg:px-16 px-6 bg-white flex flex-wrap items-center lg:py-0 py-2">
        <div className="flex-1 flex justify-between items-center">
          <Link href="/">
            <img src="/images/logo.png" alt="ilovejson" width="64" />
          </Link>
        </div>

        <label htmlFor="menu-toggle" className="pointer-cursor lg:hidden block">
          <svg className="fill-current text-gray-900" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <title>Tools</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
          </svg>
        </label>
        <input className="hidden" type="checkbox" id="menu-toggle" />

        <div className="hidden lg:flex lg:items-center lg:w-auto w-full" id="menu">
          <nav>
            <ul className="lg:flex items-center justify-between text-base text-gray-700 pt-4 lg:pt-0">
              {utils.map(({ path, name }) => (
                <li key={name}>
                  <Link href={path}>
                    <p className="lg:p-4 py-3 px-0 block border-b-2 border-transparent hover:border-indigo-400">{name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="https://github.com/ilovejson/ilovejson" className="lg:ml-4 flex items-center justify-start lg:mb-0 mb-4 pointer-cursor">
            <img className="rounded-full w-10 h-10 border-2 border-transparent hover:border-red-400" src="/images/github.png" alt="ilovejson" />
          </Link>

          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <Link href="/auth/signin" className="lg:ml-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile auth row */}
        <div className="lg:hidden w-full pb-3">
          {session ? (
            <div className="flex items-center gap-3 pt-2">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                  {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || session.user.email}</p>
              </div>
              <Link href="/dashboard" className="text-xs text-indigo-600 font-medium">Dashboard</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-xs text-red-600 font-medium">Sign out</button>
            </div>
          ) : (
            <Link href="/auth/signin" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors mt-2">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-grow">
        <h1 className="text-4xl font-semibold uppercase">{title}</h1>
        <p>{description}</p>
        {children}
      </main>

      <footer className="bg-white flex justify-center p-5">
        Made with ❤️ in India🇮🇳
      </footer>
    </div>
  )
}

export default Layout
