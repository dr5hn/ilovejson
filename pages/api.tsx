import Head from 'next/head';
import Link from 'next/link';
import { Header } from '@components/Header';
import { Footer } from '@components/Footer';

const EXAMPLES = [
  {
    title: 'Convert JSON to CSV',
    curl: `curl -X POST https://www.ilovejson.com/api/v1/convert/json/csv \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"input":[{"name":"Alice","score":99},{"name":"Bob","score":87}]}'`,
    response: `{"output":"name,score\\nAlice,99\\nBob,87","format":"csv","success":true}`,
  },
  {
    title: 'Validate JSON',
    curl: `curl -X POST https://www.ilovejson.com/api/v1/validate \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"{\\"key\\":123}"}'`,
    response: `{"valid":true,"success":true}`,
  },
  {
    title: 'JMESPath query',
    curl: `curl -X POST https://www.ilovejson.com/api/v1/query \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"input":{"users":[{"name":"Alice"},{"name":"Bob"}]},"expr":"users[].name"}'`,
    response: `{"result":["Alice","Bob"],"expr":"users[].name","success":true}`,
  },
];

export default function ApiLandingPage() {
  return (
    <>
      <Head>
        <title>REST API — ILoveJSON</title>
        <meta name="description" content="Public REST API for JSON conversion and utility tools. Authenticate with API tokens." />
      </Head>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <h1 className="text-4xl font-bold text-foreground mb-3">ILoveJSON REST API</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Automate every conversion and utility tool via a simple JSON-in, JSON-out API.
          </p>

          {/* Auth */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">Authentication</h2>
            <p className="text-muted-foreground mb-3">All <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">/api/v1/*</code> endpoints require a Bearer token in the <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">Authorization</code> header.</p>
            <pre className="bg-muted rounded-xl p-4 text-sm overflow-x-auto">Authorization: Bearer ilj_your_token_here</pre>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard/api-tokens" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Get an API token</Link>
              <Link href="/api-docs" className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted">View full docs</Link>
            </div>
          </section>

          {/* Rate limits */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">Rate limits</h2>
            <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
              <p><strong className="text-foreground">60 requests / minute</strong> and <strong className="text-foreground">1,000 requests / day</strong> per token.</p>
              <p className="mt-2">Limits are returned in response headers: <code className="font-mono bg-muted px-1 rounded">X-RateLimit-Limit</code>, <code className="font-mono bg-muted px-1 rounded">X-RateLimit-Remaining</code>, <code className="font-mono bg-muted px-1 rounded">X-RateLimit-Reset</code>. A <code className="font-mono bg-muted px-1 rounded">429</code> response includes <code className="font-mono bg-muted px-1 rounded">Retry-After</code>.</p>
            </div>
          </section>

          {/* Examples */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Examples</h2>
            <div className="space-y-6">
              {EXAMPLES.map(ex => (
                <div key={ex.title} className="bg-card border border-border rounded-xl overflow-hidden">
                  <p className="px-5 py-3 font-medium text-foreground border-b border-border text-sm">{ex.title}</p>
                  <pre className="px-5 py-4 text-xs overflow-x-auto text-muted-foreground">{ex.curl}</pre>
                  <div className="border-t border-border px-5 py-3">
                    <p className="text-xs text-muted-foreground mb-1">Response</p>
                    <pre className="text-xs text-green-600 dark:text-green-400 overflow-x-auto">{ex.response}</pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Supported conversions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-3">Supported conversions</h2>
            <p className="text-muted-foreground text-sm mb-4">All routes: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">POST /api/v1/convert/{'{from}'}/{'{to}'}</code></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {['json/csv','csv/json','json/yaml','yaml/json','json/xml','xml/json','json/php','php/json','json/markdown','markdown/json','json/html','html/json','json/toml','toml/json','json/sql','sql/json','json/typescript','typescript/json','json/excel','excel/json'].map(p => (
                <code key={p} className="font-mono bg-muted px-2 py-1 rounded text-xs">{p}</code>
              ))}
            </div>
          </section>

          {/* Utility endpoints */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Utility endpoints</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border text-sm">
              {[
                { route: 'POST /api/v1/validate', desc: 'Validate JSON syntax' },
                { route: 'POST /api/v1/beautify', desc: 'Prettify JSON with custom indent' },
                { route: 'POST /api/v1/compress', desc: 'Minify / compress JSON' },
                { route: 'POST /api/v1/diff', desc: 'Diff two JSON values' },
                { route: 'POST /api/v1/merge', desc: 'Merge 2–10 JSON objects' },
                { route: 'POST /api/v1/query', desc: 'Run a JMESPath expression' },
                { route: 'POST /api/v1/schema', desc: 'Generate a JSON Schema' },
                { route: 'POST /api/v1/faker', desc: 'Generate fake data from a schema' },
              ].map(e => (
                <div key={e.route} className="flex items-center gap-4 px-5 py-3">
                  <code className="font-mono text-xs text-red-500 w-56 shrink-0">{e.route}</code>
                  <span className="text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
