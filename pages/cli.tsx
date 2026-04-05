import Layout from "@components/layout"
import Head from "next/head"
import { Terminal, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CLIPage() {
  return (
    <Layout>
      <Head>
        <title>CLI Tool - Coming Soon | I Love JSON</title>
        <meta
          name="description"
          content="A powerful command-line tool for JSON conversions and utilities. Coming soon."
        />
      </Head>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-300px)] px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <Terminal className="w-10 h-10 text-white" />
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-medium mb-6">
            Coming Soon
          </span>

          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6">
            I Love JSON CLI
          </h1>

          <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
            Convert, validate, and transform JSON files directly from your terminal.
            All the power of I Love JSON, right in your command line.
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left font-mono text-sm">
            <div className="text-muted-foreground mb-2">
              <span className="text-emerald-500">$</span> npx ilovejson convert data.json --to csv
            </div>
            <div className="text-muted-foreground mb-2">
              <span className="text-emerald-500">$</span> npx ilovejson validate schema.json
            </div>
            <div className="text-muted-foreground">
              <span className="text-emerald-500">$</span> npx ilovejson beautify messy.json
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground font-semibold rounded-xl transition-all hover:-translate-y-0.5 group"
          >
            Explore Web Tools
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </Layout>
  )
}
