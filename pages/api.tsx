"use client"

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@components/Header';
import { Footer } from '@components/Footer';

const CONVERSIONS = [
  'JSON → CSV', 'CSV → JSON', 'JSON → YAML', 'YAML → JSON',
  'JSON → XML', 'XML → JSON', 'JSON → TypeScript', 'TypeScript → JSON',
  'JSON → PHP', 'PHP → JSON', 'JSON → SQL', 'SQL → JSON',
  'JSON → Markdown', 'Markdown → JSON', 'JSON → HTML', 'HTML → JSON',
  'JSON → TOML', 'TOML → JSON', 'JSON → Excel', 'Excel → JSON',
];

const UTILITIES = [
  { method: 'POST', route: '/api/v1/validate', desc: 'Validate JSON syntax and structure' },
  { method: 'POST', route: '/api/v1/beautify', desc: 'Prettify JSON with custom indentation' },
  { method: 'POST', route: '/api/v1/compress', desc: 'Minify JSON by stripping whitespace' },
  { method: 'POST', route: '/api/v1/diff', desc: 'Diff two JSON values, line by line' },
  { method: 'POST', route: '/api/v1/merge', desc: 'Deep-merge 2–10 JSON objects' },
  { method: 'POST', route: '/api/v1/query', desc: 'Run JMESPath expressions over JSON' },
  { method: 'POST', route: '/api/v1/schema', desc: 'Generate a JSON Schema from any value' },
  { method: 'POST', route: '/api/v1/faker', desc: 'Generate fake data from a JSON Schema' },
];

const EXAMPLES = [
  {
    tab: 'Convert',
    title: 'JSON → CSV',
    request: `curl -X POST https://www.ilovejson.com/api/v1/convert/json/csv \\
  -H "Authorization: Bearer ilj_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": [
      {"name":"Alice","score":99},
      {"name":"Bob","score":87}
    ]
  }'`,
    response: `{
  "output": "name,score\\nAlice,99\\nBob,87",
  "format": "csv",
  "success": true
}`,
  },
  {
    tab: 'Validate',
    title: 'Validate JSON',
    request: `curl -X POST https://www.ilovejson.com/api/v1/validate \\
  -H "Authorization: Bearer ilj_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "{\\"key\\": 123}"}'`,
    response: `{
  "valid": true,
  "success": true
}`,
  },
  {
    tab: 'Query',
    title: 'JMESPath Query',
    request: `curl -X POST https://www.ilovejson.com/api/v1/query \\
  -H "Authorization: Bearer ilj_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {"users":[{"name":"Alice"},{"name":"Bob"}]},
    "expr": "users[].name"
  }'`,
    response: `{
  "result": ["Alice", "Bob"],
  "expr": "users[].name",
  "success": true
}`,
  },
  {
    tab: 'Schema',
    title: 'Generate Schema',
    request: `curl -X POST https://www.ilovejson.com/api/v1/schema \\
  -H "Authorization: Bearer ilj_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{"input": {"id":1,"name":"Alice","active":true}}'`,
    response: `{
  "schema": {
    "type": "object",
    "properties": {
      "id":     {"type":"integer"},
      "name":   {"type":"string"},
      "active": {"type":"boolean"}
    }
  },
  "success": true
}`,
  },
];

const PLANS = [
  {
    key: 'PRO',
    name: 'Pro',
    price: 9,
    badge: 'Most popular',
    highlight: true,
    perks: [
      '60 requests / minute',
      '10,000 requests / day',
      'Up to 3 API tokens',
      'All 28 endpoints',
      'Rate-limit response headers',
      'Email support',
    ],
    cta: 'Start with Pro',
    planId: 'pro_monthly',
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    price: 49,
    badge: 'High volume',
    highlight: false,
    perks: [
      '600 requests / minute',
      '1,000,000 requests / day',
      'Unlimited API tokens',
      'All 28 endpoints',
      'Rate-limit response headers',
      'Priority email support (24 h)',
    ],
    cta: 'Start with Business',
    planId: 'business_monthly',
  },
];

function Check() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ApiLandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  async function goToCheckout(planId: string) {
    setLoadingPlan(planId);
    setCheckoutError('');
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError('Could not start checkout. Please try again.');
      }
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      <Head>
        <title>REST API — ILoveJSON</title>
        <meta name="description" content="Automate JSON conversion and transformation via a simple REST API. 28 endpoints, Bearer token auth, JSON-in JSON-out." />
      </Head>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <section className="relative overflow-hidden pt-20 pb-24 px-4">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-200/30 via-rose-200/20 to-transparent rounded-full blur-3xl -translate-y-1/2" />
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl translate-y-1/3" />
            </div>

            <div className="relative max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                REST API · Now Available
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.05] tracking-tight">
                The JSON API<br />
                <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                  built for developers
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Convert, validate, query, and transform JSON programmatically.
                <strong className="text-foreground"> 20 format conversions + 8 utilities.</strong> JSON-in, JSON-out. One line of curl.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
                <Link
                  href="/dashboard/api-tokens"
                  className="px-7 py-3.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25 text-sm"
                >
                  Get your API token
                </Link>
                <Link
                  href="/api-docs"
                  className="px-7 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-secondary transition-colors text-sm"
                >
                  Browse full docs
                </Link>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: '28 endpoints' },
                  { label: 'JSON-in / JSON-out' },
                  { label: 'Bearer token auth' },
                  { label: 'Rate-limit headers' },
                  { label: 'No SDK required' },
                ].map(s => (
                  <span key={s.label} className="px-4 py-2 bg-card border border-border rounded-full text-xs font-semibold text-muted-foreground">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Code Examples ────────────────────────────────────── */}
          <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">
                  One request. Any format.
                </h2>
                <p className="text-muted-foreground text-lg">
                  Every endpoint follows the same pattern — send JSON, get JSON back.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={ex.tab}
                    onClick={() => setActiveTab(i)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeTab === i
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ex.tab}
                  </button>
                ))}
              </div>

              {/* Code panel */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-border bg-muted/40">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-xs text-muted-foreground font-mono">{EXAMPLES[activeTab].title}</span>
                </div>
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Request</p>
                    <pre className="text-xs text-foreground/80 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">{EXAMPLES[activeTab].request}</pre>
                  </div>
                  <div className="p-6 bg-muted/20">
                    <p className="text-xs font-semibold text-green-600 mb-3 uppercase tracking-wider">Response 200 OK</p>
                    <pre className="text-xs text-green-600 overflow-x-auto leading-relaxed font-mono">{EXAMPLES[activeTab].response}</pre>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Base URL: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">https://www.ilovejson.com</code>
                &nbsp;·&nbsp;
                Auth header: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer ilj_…</code>
              </p>
            </div>
          </section>

          {/* ── Feature highlights ───────────────────────────────── */}
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">
                  Everything your pipeline needs
                </h2>
                <p className="text-muted-foreground text-lg">Built to slot into any workflow without friction.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: '⚡',
                    title: 'Instant responses',
                    desc: 'Synchronous API — every response is immediate. No polling, no queues, no webhooks required.',
                  },
                  {
                    icon: '🔑',
                    title: 'Simple token auth',
                    desc: 'Generate an API token in your dashboard and pass it as a Bearer header. Tokens can be named, rotated, and revoked at any time.',
                  },
                  {
                    icon: '📊',
                    title: 'Rate-limit headers',
                    desc: 'Every response includes X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset so you can pace your requests.',
                  },
                  {
                    icon: '🔄',
                    title: '20 format conversions',
                    desc: 'CSV, YAML, XML, TypeScript, PHP, SQL, Markdown, HTML, TOML, Excel — bidirectional. All under one route pattern.',
                  },
                  {
                    icon: '🛠️',
                    title: '8 utility endpoints',
                    desc: 'Validate, beautify, compress, diff, merge, query (JMESPath), generate schema, and fake data — all in one API.',
                  },
                  {
                    icon: '🔒',
                    title: 'No data retention',
                    desc: 'Your data is processed in-memory and never stored. What you send stays private.',
                  },
                ].map(f => (
                  <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-red-200 transition-colors">
                    <div className="text-3xl mb-4">{f.icon}</div>
                    <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Endpoint reference ───────────────────────────────── */}
          <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">28 endpoints. One API.</h2>
                <p className="text-muted-foreground text-lg">All conversions share the same route pattern.</p>
                <div className="mt-4 inline-block font-mono text-sm bg-card border border-border px-4 py-2 rounded-xl">
                  POST /api/v1/convert/<span className="text-red-500">{'{from}'}</span>/<span className="text-red-500">{'{to}'}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Conversions */}
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Format Conversions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CONVERSIONS.map(c => (
                      <div key={c} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground hover:border-red-200 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Utilities */}
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Utility Endpoints</h3>
                  <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                    {UTILITIES.map(u => (
                      <div key={u.route} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                        <span className="shrink-0 mt-0.5 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">{u.method}</span>
                        <div>
                          <code className="text-xs font-mono text-foreground">{u.route}</code>
                          <p className="text-xs text-muted-foreground mt-0.5">{u.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── How it works ─────────────────────────────────────── */}
          <section className="py-20 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">Up and running in 60 seconds</h2>
              </div>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Sign up and get a token',
                    desc: 'Create a free account and generate an API token from your dashboard. Tokens are named and revocable.',
                    action: { label: 'Get a token →', href: '/dashboard/api-tokens' },
                  },
                  {
                    step: '02',
                    title: 'Pick your endpoint',
                    desc: 'Choose any of the 28 endpoints. All follow the same JSON-in, JSON-out pattern. Check the full Swagger docs for request shapes.',
                    action: { label: 'Browse docs →', href: '/api-docs' },
                  },
                  {
                    step: '03',
                    title: 'Make your first request',
                    desc: 'Send a POST with your Bearer token and JSON body. Get a response in milliseconds. Monitor usage in your dashboard.',
                    action: { label: 'View usage →', href: '/dashboard/api-usage' },
                  },
                ].map(s => (
                  <div key={s.step} className="flex gap-6 bg-card border border-border rounded-2xl p-6">
                    <div className="text-3xl font-black text-muted-foreground/30 shrink-0 font-mono leading-none pt-1">{s.step}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.desc}</p>
                      <Link href={s.action.href} className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
                        {s.action.label}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Pricing ──────────────────────────────────────────── */}
          <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">Simple, predictable pricing</h2>
                <p className="text-muted-foreground text-lg">API access is included with Pro and Business. No per-call fees, ever.</p>
              </div>

              {checkoutError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 text-center">
                  {checkoutError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {PLANS.map(plan => (
                  <div
                    key={plan.key}
                    className={`relative rounded-2xl border p-8 flex flex-col ${
                      plan.highlight
                        ? 'border-red-400 shadow-2xl shadow-red-500/10 bg-card'
                        : 'border-border bg-card'
                    }`}
                  >
                    {plan.badge && (
                      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-white text-xs font-bold rounded-full whitespace-nowrap ${plan.highlight ? 'bg-red-500' : 'bg-foreground'}`}>
                        {plan.badge}
                      </span>
                    )}
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-foreground mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                    </div>
                    <ul className="space-y-3 flex-1 mb-8">
                      {plan.perks.map(p => (
                        <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                          <Check />{p}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => goToCheckout(plan.planId)}
                      disabled={!!loadingPlan}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                        plan.highlight
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'border border-border text-foreground hover:bg-secondary'
                      }`}
                    >
                      {loadingPlan === plan.planId ? 'Redirecting…' : plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-8">
                Already have a plan?{' '}
                <Link href="/dashboard/api-tokens" className="text-red-500 font-semibold hover:underline">
                  Go to your dashboard
                </Link>
              </p>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────────── */}
          <section className="py-24 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
                Start automating JSON<br />in minutes.
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                One API. 28 endpoints. No boilerplate. Get your token and make your first call today.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/api-tokens"
                  className="px-8 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25 text-sm"
                >
                  Get your API token
                </Link>
                <Link
                  href="/api-docs"
                  className="px-8 py-4 border border-border text-foreground font-bold rounded-xl hover:bg-secondary transition-colors text-sm"
                >
                  View API Docs
                </Link>
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </>
  );
}
