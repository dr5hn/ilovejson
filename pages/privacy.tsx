import Layout from '@components/layout'
import Head from 'next/head'

export default function PrivacyPage() {
  return (
    <Layout>
      <Head>
        <title>Privacy Policy - I Love JSON</title>
        <meta name="description" content="Privacy policy for ILoveJSON. Learn how we handle your data when you use our free online JSON tools." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Your Privacy Matters</h2>
          <p>I Love JSON is designed with privacy as a core principle. We process your files on our servers only for the duration of the conversion, and delete them automatically.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Files you upload:</strong> Temporarily stored for conversion only. Automatically deleted within minutes.</li>
            <li><strong>Account data (optional):</strong> If you sign in via OAuth, we store your name, email, and profile image for session management.</li>
            <li><strong>Usage data:</strong> Basic analytics such as page views and tool usage counts to improve the service.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Data We Do NOT Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not read, analyze, or store the contents of your files beyond the conversion process.</li>
            <li>We do not sell or share your data with third parties.</li>
            <li>We do not use your data for advertising or AI training.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Cookies</h2>
          <p>We use essential cookies for session management and theme preferences. No third-party tracking cookies are used.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">Contact</h2>
          <p>Questions about this policy? Reach us at <a href="mailto:privacy@ilovejson.com" className="text-primary hover:underline">privacy@ilovejson.com</a>.</p>
        </div>
      </div>
    </Layout>
  )
}
