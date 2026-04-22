import Layout from '@components/layout';

const Privacy = () => (
  <Layout
    title="Privacy Policy"
    description="What ILoveJSON collects and why."
  >
    <div className="max-w-3xl mx-auto px-6 py-10 prose prose-gray">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: April 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">The short version</h2>
        <p className="text-gray-700">
          We do not read, store, or transmit the files or JSON data you upload. Files are deleted
          from the server within 30 minutes. We collect anonymous usage metrics (which tools are
          used, not what data they process) and error reports to keep the service running well.
          No analytics cookies are set.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">File uploads</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Uploaded files are stored temporarily on the server to perform the conversion.</li>
          <li>Files are automatically deleted within 30 minutes of upload.</li>
          <li>
            File contents are <strong>never</strong> read by our team, logged, indexed, or
            transmitted to any third-party service.
          </li>
          <li>File names are not recorded in analytics or error reports.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Error tracking</h2>
        <p className="text-gray-700 mb-3">
          We use <strong>Sentry</strong> to capture application errors. When an error occurs, the
          following information may be sent to Sentry:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Error message and stack trace</li>
          <li>The tool or page where the error occurred (e.g. &ldquo;json-to-csv&rdquo;)</li>
          <li>HTTP method and route (e.g. POST /api/jsontocsv)</li>
          <li>Browser type and operating system</li>
        </ul>
        <p className="text-gray-700 mt-3">
          The following are <strong>explicitly excluded</strong> from error reports:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>File contents or any uploaded data</li>
          <li>Request bodies</li>
          <li>IP addresses (IP capture is disabled)</li>
          <li>Cookies or session tokens</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Usage analytics</h2>
        <p className="text-gray-700 mb-3">
          We use <strong>Umami</strong>, a privacy-respecting, cookie-free analytics platform. The
          following events are recorded:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Page views (URL path only — query strings are stripped)</li>
          <li>Which tool was used (e.g. &ldquo;json-to-csv&rdquo;)</li>
          <li>Whether a conversion succeeded or failed, and its duration</li>
          <li>Download events (tool name only)</li>
        </ul>
        <p className="text-gray-700 mt-3">
          The following are <strong>never</strong> recorded in analytics:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>File contents, file names, or any user data</li>
          <li>JSON keys, schema, or structure from your files</li>
          <li>Full error messages (only a category like &ldquo;invalid_format&rdquo;)</li>
        </ul>
        <p className="text-gray-700 mt-3">
          Umami does not use cookies and does not track users across sessions or sites. It complies
          with GDPR, CCPA, and PECR without requiring a consent banner.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Cookies</h2>
        <p className="text-gray-700">
          ILoveJSON does not set any analytics or tracking cookies. We do not use Google Analytics
          or any other cookie-based tracking tool.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Self-hosting</h2>
        <p className="text-gray-700">
          ILoveJSON is open source. If you self-host the application, error tracking and analytics
          are disabled by default unless you configure the relevant environment variables
          (<code>NEXT_PUBLIC_SENTRY_DSN</code>, <code>NEXT_PUBLIC_UMAMI_WEBSITE_ID</code>,
          <code>NEXT_PUBLIC_UMAMI_URL</code>). See the <code>.env.example</code> file in the
          repository for details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p className="text-gray-700">
          Questions about this policy? Open an issue on{' '}
          <a
            href="https://github.com/ilovejson/ilovejson"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  </Layout>
);

export default Privacy;
