import Link from 'next/link'
import { utils } from '@constants/utils';

const Layout = ({
  children,
  title,
  description
}) => (
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
      </div>
    </header>

    <main className="flex-grow">
      <h1 className="text-4xl font-semibold uppercase">
        {title}
      </h1>

      <p>
        {description}
      </p>
      {children}
    </main>

    <footer className="bg-white flex justify-center p-5">
      Made with ❤️ in India🇮🇳
    </footer>
  </div>
)

export default Layout
