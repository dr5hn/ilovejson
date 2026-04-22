import '../styles/index.css';
import '../sentry.client.config';
import { useEffect } from 'react';
import Head from 'next/head';
import * as Sentry from '@sentry/nextjs';
import ErrorBoundary from '@components/ErrorBoundary';

function MyApp({ Component, pageProps }) {
  const og = pageProps.data?.og
  const title = pageProps.data?.title

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.captureException(event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
    <>
      <Head>
        <title>{title || 'ILoveJSON | Online JSON Tools for JSON Lovers'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name='description' content='I Love JSON is an online service to modify, customize and work with JSON files freely.' />
        <meta name='keywords' content='json to csv, csv to json, json to xml, xml to json, json to yaml, yaml to json, beautify json, json viewer, json editor' />

        {/* Opengraph */}
        <meta property="og:title" content={title || `ILoveJSON | Online JSON Tools for JSON Lovers`} />
        <meta property="og:site_name" content="ILoveJSON | Online JSON Tools for JSON Lovers" />
        <meta property="og:description" content={og ? og.description : `Online JSON Tools for JSON Lovers`} />
        <meta property="og:image" content={og ? og.image : `https://www.ilovejson.com/images/web-og-banner.png`} />
        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://www.ilovejson.com/"/>

        {/* Twitter Meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ilovejson_com" />
        <meta name="twitter:creator" content="@ilovejson_com" />
        <meta name="twitter:title" content="ILoveJSON | Online JSON Tools for JSON Lovers" />
        <meta name="twitter:description" content="I Love JSON is an online service to modify, customize and work with JSON files freely." />
        <meta name="twitter:image:src" content="https://www.ilovejson.com/images/web-og-banner.png"/>

        {/* Manifests */}
        <link rel='manifest' href='/site.webmanifest' />
        <link href='/icons/favicon-16x16.png' rel='icon' type='image/png' sizes='16x16' />
        <link href='/icons/favicon-32x32.png' rel='icon' type='image/png' sizes='32x32' />
        <link href='/icons/apple-touch-icon.png' rel='apple-touch-icon' type='image/png' sizes='180x180' />
        <meta name='theme-color' content='#FFFFFF' />
      </Head>

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  )
}

export default MyApp
