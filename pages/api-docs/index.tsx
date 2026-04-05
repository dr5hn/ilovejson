import { Header } from "@components/Header"
import { Footer } from "@components/Footer"
import { Code, Bell, ArrowRight } from "lucide-react"
import Link from "next/link"
import Head from "next/head"

export default function ApiDocsPage() {
  return (
    <>
      <Head>
        <title>API - Coming Soon - I Love JSON</title>
        <meta name="description" content="A REST API for I Love JSON tools is coming soon." />
      </Head>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/20">
              <Code className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              API Coming Soon
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
              We are building a REST API so you can integrate all I Love JSON tools directly into your applications and CI/CD pipelines.
            </p>

            <div className="bg-card rounded-2xl border border-border p-8 mb-8 text-left">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                What to expect
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  All conversion tools available as API endpoints
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  Simple API key authentication
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  Up to 100MB file processing per request
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  SDKs for JavaScript, Python, and cURL examples
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground mb-6">
              In the meantime, all tools are available for free on the web.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
            >
              Use Tools Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
