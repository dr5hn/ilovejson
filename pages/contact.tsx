import Layout from '@components/layout'
import Head from 'next/head'
import { MessageSquare, Code } from 'lucide-react'

export default function ContactPage() {
  return (
    <Layout>
      <Head>
        <title>Contact Us - I Love JSON</title>
        <meta name="description" content="Get in touch with the ILoveJSON team. Report bugs, request features, or ask questions about our free JSON tools." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have a question, bug report, or feature request? We would love to hear from you.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <a
            href="https://github.com/ilovejson/ilovejson/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card hover:bg-secondary transition-colors text-center"
          >
            <Code className="w-8 h-8 text-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">GitHub Issues</h3>
              <p className="text-sm text-muted-foreground">Report bugs or request features</p>
            </div>
          </a>

          <a
            href="https://github.com/ilovejson/ilovejson/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card hover:bg-secondary transition-colors text-center"
          >
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-semibold text-foreground">Discussions</h3>
              <p className="text-sm text-muted-foreground">Join the community</p>
            </div>
          </a>
        </div>
      </div>
    </Layout>
  )
}
