import '../styles/index.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { SessionProvider } from 'next-auth/react'

const SITE_URL = 'https://www.ilovejson.com'
const SITE_NAME = 'ILoveJSON'
const DEFAULT_TITLE = 'ILoveJSON | Free Online JSON Tools for Developers'
const DEFAULT_DESCRIPTION = 'Free online JSON tools — convert, format, validate, diff, merge, query, and generate fake data. Supports CSV, YAML, XML, TOML, SQL, TypeScript, Excel, and more.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/web-og-banner.png`

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()
  const og = (pageProps as any).data?.og
  const title = (pageProps as any).data?.title
  const canonicalUrl = `${SITE_URL}${router.asPath.split('?')[0].split('#')[0]}`

  return (
    <>
      <Head>
        <title>{title || DEFAULT_TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta name="keywords" content="json tools, json converter, json to csv, csv to json, json to xml, xml to json, json to yaml, yaml to json, json formatter, json validator, json beautifier, json editor, json viewer, json diff, json merge, json schema generator, online json tools, free json converter" />

        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />

        {/* OpenGraph */}
        <meta property="og:title" content={title || DEFAULT_TITLE} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:description" content={og?.description || DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={og?.image || DEFAULT_OG_IMAGE} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ilovejson_com" />
        <meta name="twitter:creator" content="@ilovejson_com" />
        <meta name="twitter:title" content={title || DEFAULT_TITLE} />
        <meta name="twitter:description" content={og?.description || DEFAULT_DESCRIPTION} />
        <meta name="twitter:image" content={og?.image || DEFAULT_OG_IMAGE} />

        {/* Manifests & Icons */}
        <link rel="manifest" href="/site.webmanifest" />
        <link href="/icons/favicon-16x16.png" rel="icon" type="image/png" sizes="16x16" />
        <link href="/icons/favicon-32x32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" type="image/png" sizes="180x180" />
        <meta name="theme-color" content="#DD2E44" />

        {/* JSON-LD: WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": SITE_NAME,
              "alternateName": "I Love JSON",
              "url": SITE_URL,
              "description": DEFAULT_DESCRIPTION,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${SITE_URL}/#tools?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": SITE_NAME,
              "url": SITE_URL,
              "logo": `${SITE_URL}/icons/android-chrome-512x512.png`,
              "sameAs": [
                "https://twitter.com/ilovejson_com"
              ]
            })
          }}
        />
      </Head>

      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  )
}

export default MyApp
