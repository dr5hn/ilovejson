import Link from 'next/link'
import { utils } from '@constants/utils';
import ThemeToggle from '@components/ThemeToggle';
import AuthButton from '@components/AuthButton';
import UserMenu from '@components/UserMenu';

const Layout = ({
  children,
  title,
  description
}) => (
  <div className="antialiased bg-gray-200 dark:bg-dark-bg flex flex-col min-h-screen transition-colors duration-200">
    <header className="lg:px-16 px-6 bg-white dark:bg-dark-surface flex flex-wrap items-center lg:py-0 py-2 transition-colors duration-200">
      <div className="flex-1 flex justify-between items-center">
        <Link href="/">
          <img src="/images/logo.png" alt="ilovejson" width="64" className="dark:brightness-110" />
        </Link>
      </div>

      <label htmlFor="menu-toggle" className="pointer-cursor lg:hidden block">
        <svg className="fill-current text-gray-900 dark:text-dark-text" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <title>Tools</title>
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
        </svg>
      </label>
      <input className="hidden" type="checkbox" id="menu-toggle" />

      <div className="hidden lg:flex lg:items-center lg:w-auto w-full" id="menu">
        <nav>
          <ul className="lg:flex items-center justify-between text-base text-gray-700 dark:text-dark-text pt-4 lg:pt-0">
            {utils.map(({ path, name }) => (
              <li key={name}>
                <Link href={path}>
                  <p className="lg:p-4 py-3 px-0 block border-b-2 border-transparent hover:border-indigo-400 dark:hover:border-indigo-300">{name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:ml-4 flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
          <UserMenu />
          <Link href="https://github.com/ilovejson/ilovejson" className="flex items-center justify-start lg:mb-0 mb-4 pointer-cursor">
            <img className="rounded-full w-10 h-10 border-2 border-transparent hover:border-red-400 dark:invert" src="/images/github.png" alt="ilovejson" />
          </Link>
        </div>
      </div>
    </header>

    <main className="flex-grow">
      <h1 className="text-2xl md:text-4xl font-semibold uppercase text-gray-900 dark:text-dark-text">
        {title}
      </h1>

      <p className="text-gray-700 dark:text-dark-muted">
        {description}
      </p>
      {children}
    </main>

    <footer className="bg-white dark:bg-dark-surface flex justify-center p-5 text-gray-900 dark:text-dark-text transition-colors duration-200">
      Made with ❤️ in India🇮🇳
    </footer>
  </div>
)

export default Layout
