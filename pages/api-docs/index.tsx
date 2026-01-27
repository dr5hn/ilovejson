import { Header } from "@components/Header"
import { Footer } from "@components/Footer"
import { Code, Key, Zap, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"
import Head from "next/head"

export default function ApiDocsPage() {
  return (
    <>
      <Head>
        <title>API Documentation - I Love JSON</title>
        <meta name="description" content="Build powerful integrations with the I Love JSON REST API." />
      </Head>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-16">
          <div className="max-w-5xl mx-auto px-4">
            {/* Hero */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full text-sm font-medium mb-6">
                <Code className="w-4 h-4" />
                API Documentation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Build with iLoveJSON API
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Integrate powerful JSON tools into your applications with our simple REST API.
              </p>
            </div>

            {/* Quick Start */}
            <div className="bg-card rounded-3xl border border-border p-8 mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Quick Start</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Get your API key</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign up for a Pro account to get your API key from the dashboard.
                  </p>
                  <Link
                    href="/api/auth/signin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Get API Key
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Make your first request</h3>
                  <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-100">
{`curl -X POST https://api.ilovejson.com/v1/beautify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"json": "{\\"name\\":\\"John\\",\\"age\\":30}"}'`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. Response</h3>
                  <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-100">
{`{
  "success": true,
  "result": "{\\n  \\"name\\": \\"John\\",\\n  \\"age\\": 30\\n}",
  "meta": {
    "inputSize": 24,
    "outputSize": 38,
    "processingTime": 2
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Available Endpoints</h2>

              <div className="space-y-4">
                {[
                  { method: "POST", path: "/v1/beautify", desc: "Format and beautify JSON" },
                  { method: "POST", path: "/v1/minify", desc: "Minify/compress JSON" },
                  { method: "POST", path: "/v1/validate", desc: "Validate JSON syntax" },
                  { method: "POST", path: "/v1/convert/csv", desc: "Convert JSON to CSV" },
                  { method: "POST", path: "/v1/convert/yaml", desc: "Convert JSON to YAML" },
                  { method: "POST", path: "/v1/convert/xml", desc: "Convert JSON to XML" },
                  { method: "POST", path: "/v1/schema", desc: "Generate JSON Schema" },
                  { method: "POST", path: "/v1/diff", desc: "Compare two JSON objects" },
                  { method: "POST", path: "/v1/merge", desc: "Merge JSON objects" },
                  { method: "POST", path: "/v1/query", desc: "Query JSON with JSONPath" },
                ].map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-red-200 dark:hover:border-red-900 transition-colors"
                  >
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-mono font-bold">
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm text-foreground flex-1">{endpoint.path}</code>
                    <span className="text-muted-foreground text-sm">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Fast & Reliable</h3>
                <p className="text-muted-foreground text-sm">
                  Average response time under 50ms. 99.9% uptime SLA for Pro users.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Secure</h3>
                <p className="text-muted-foreground text-sm">
                  All requests over HTTPS. Data deleted within 2 minutes of processing.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Simple Auth</h3>
                <p className="text-muted-foreground text-sm">
                  Bearer token authentication. Rate limits based on your plan.
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 md:p-12 text-white">
              <h2 className="text-2xl font-bold mb-4">API Pricing</h2>
              <p className="text-zinc-300 mb-8">
                API access is included with Pro subscription. Additional requests available as add-ons.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">$19</div>
                  <div className="text-zinc-400 mb-4">/month</div>
                  <div className="text-sm">10,000 requests/month</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 ring-2 ring-red-500">
                  <div className="text-3xl font-bold mb-2">$49</div>
                  <div className="text-zinc-400 mb-4">/month</div>
                  <div className="text-sm">50,000 requests/month</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="text-3xl font-bold mb-2">$199</div>
                  <div className="text-zinc-400 mb-4">/month</div>
                  <div className="text-sm">Unlimited requests</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
