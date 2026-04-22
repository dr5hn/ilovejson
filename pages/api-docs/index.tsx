import Head from 'next/head';
import Script from 'next/script';

export default function ApiDocsPage() {
  return (
    <>
      <Head>
        <title>API Documentation — ILoveJSON</title>
        <meta name="description" content="Interactive API documentation for the ILoveJSON REST API." />
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
        <style>{`body { margin: 0; } .swagger-ui .topbar { display: none; }`}</style>
      </Head>

      <div id="swagger-ui" />

      <Script
        src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          window.SwaggerUIBundle({
            dom_id: '#swagger-ui',
            url: '/api/v1/openapi.json',
            // @ts-ignore
            presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'BaseLayout',
            deepLinking: true,
            tryItOutEnabled: true,
          });
        }}
      />
    </>
  );
}
