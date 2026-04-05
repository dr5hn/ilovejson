import Layout from '@components/layout'
import Head from 'next/head'

export default function TermsPage() {
  return (
    <Layout>
      <Head>
        <title>Terms of Service - I Love JSON</title>
        <meta name="description" content="Terms of service for ILoveJSON. Understand the rules and guidelines for using our free online JSON tools." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Acceptance of Terms</h2>
          <p>By using I Love JSON, you agree to these terms. The service is provided as-is for personal and commercial use.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Service Description</h2>
          <p>I Love JSON provides free online tools for converting, formatting, validating, and transforming JSON files. Files are processed on our servers and automatically deleted after conversion.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Do not abuse the service with automated bulk requests beyond the rate limits.</li>
            <li>Do not attempt to access other users' data or interfere with the service.</li>
            <li>Do not upload malicious files designed to exploit the service.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Limitation of Liability</h2>
          <p>I Love JSON is provided without warranty. We are not liable for data loss, conversion errors, or service interruptions. Always keep backups of your original files.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Changes to Terms</h2>
          <p>We may update these terms. Continued use of the service constitutes acceptance of any changes.</p>
        </div>
      </div>
    </Layout>
  )
}
