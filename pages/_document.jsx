import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <Html lang="en">
      <Head>
        {umamiUrl && umamiId && (
          <script
            defer
            src={umamiUrl}
            data-website-id={umamiId}
          />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
