import { useState, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@components/layout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';

// ─── API pricing tiers ───────────────────────────────────────────────────────

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Everything you need to get started.',
    cta: 'Start free',
    ctaHref: '/',
    highlight: false,
    icon: '🆓',
    color: 'border-border',
    btnClass: 'border border-border text-foreground hover:bg-secondary',
    features: [
      '5 MB max upload size',
      '30-day conversion history',
      'All conversion & utility tools',
      'Unlimited anonymous usage',
    ],
    missing: [],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: { monthly: 9, annual: 7 },
    planId: { monthly: 'pro_monthly', annual: 'pro_annual' },
    description: 'For power users who need more headroom.',
    cta: 'Go Pro',
    highlight: true,
    badge: 'Most popular',
    icon: '⚡',
    color: 'border-red-500',
    btnClass: 'bg-red-500 text-white hover:bg-red-600',
    features: [
      '100 MB max upload size',
      '1-year conversion history',
      'API access (60 req/min, 10 000/day)',
      'Up to 3 API tokens',
      'Email support',
    ],
    missing: [],
  },
  {
    key: 'business',
    name: 'Business',
    price: { monthly: 49, annual: 41 },
    planId: { monthly: 'business_monthly', annual: 'business_annual' },
    description: 'For teams with high-volume needs.',
    cta: 'Go Business',
    highlight: false,
    icon: '🏢',
    color: 'border-border',
    btnClass: 'border border-border text-foreground hover:bg-secondary',
    features: [
      '2 GB max upload size',
      'Unlimited conversion history',
      'API access (600 req/min, 1M/day)',
      'Unlimited API tokens',
      'Priority email support (24 h)',
    ],
    missing: [],
  },
];

const TIER_ORDER = { free: 0, pro: 1, business: 2 };

const COMPARISON = [
  {
    category: 'File Limits',
    collapsible: false,
    rows: [
      { feature: 'Max upload size', free: '5 MB', pro: '100 MB', business: '2 GB' },
      { feature: 'Conversion history', free: '30 days', pro: '1 year', business: 'Unlimited' },
    ],
  },
  {
    category: 'Batch processing',
    collapsible: true,
    summary: { free: '1 file / task', pro: 'Up to 10 files', business: 'Unlimited' },
    rows: [
      { feature: 'JSON → CSV', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → YAML', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → XML', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → SQL', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → Excel', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → Markdown', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → HTML', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → TypeScript', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → TOML', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'JSON → PHP Array', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'CSV → JSON', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'YAML → JSON', free: '1', pro: '10', business: 'Unlimited' },
      { feature: 'XML → JSON', free: '1', pro: '10', business: 'Unlimited' },
    ],
  },
  {
    category: 'Tools',
    collapsible: false,
    rows: [
      { feature: 'All conversion tools', free: true, pro: true, business: true },
      { feature: 'All utility tools', free: true, pro: true, business: true },
      { feature: 'JSON ↔ CSV', free: true, pro: true, business: true },
      { feature: 'JSON ↔ YAML / TOML / XML', free: true, pro: true, business: true },
      { feature: 'JSON ↔ SQL / Excel / HTML', free: true, pro: true, business: true },
      { feature: 'Diff, Merge, Query, Faker', free: true, pro: true, business: true },
    ],
  },
  {
    category: 'API Access',
    collapsible: false,
    rows: [
      { feature: 'REST API access', free: false, pro: true, business: true },
      { feature: 'Max file size per request', free: '5 MB', pro: '100 MB', business: '2 GB' },
      { feature: 'Requests per minute', free: '—', pro: '60 / min', business: '600 / min' },
      { feature: 'Requests per day', free: '—', pro: '10,000 / day', business: '1,000,000 / day' },
      { feature: 'API tokens', free: '—', pro: 'Up to 3', business: 'Unlimited' },
      { feature: 'API usage dashboard', free: false, pro: true, business: true },
    ],
  },
  {
    category: 'Support',
    collapsible: false,
    rows: [
      { feature: 'Email support', free: false, pro: true, business: true },
      { feature: 'Priority support (24 h SLA)', free: false, pro: false, business: true },
    ],
  },
];

// ─── Tools pricing tiers ─────────────────────────────────────────────────────

const TOOLS_TIERS = [
  {
    key: 'tools_free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'All tools included, no sign-in needed.',
    cta: 'Start free',
    ctaHref: '/',
    highlight: false,
    icon: '🆓',
    btnClass: 'border border-border text-foreground hover:bg-secondary',
    features: [
      'All conversion & utility tools',
      '1 file per converter per day',
      '5 MB max file size',
      'No account required',
    ],
    missing: [
      'Unlimited daily conversions',
      'Unlimited file size',
      'Batch processing',
    ],
  },
  {
    key: 'tools_pro',
    name: 'Pro',
    price: { monthly: 3, annual: 2 },
    planId: { monthly: 'tools_pro_monthly', annual: 'tools_pro_annual' },
    description: 'No limits. Convert as much as you need.',
    cta: 'Go Pro',
    highlight: true,
    badge: 'Best value',
    icon: '⚡',
    btnClass: 'bg-red-500 text-white hover:bg-red-600',
    features: [
      'All conversion & utility tools',
      'Unlimited daily conversions',
      'Unlimited file size',
      'Batch processing (up to 10 files)',
      'Email support',
    ],
    missing: [],
  },
];

const TOOLS_COMPARISON = [
  {
    category: 'Converters',
    collapsible: true,
    summary: { free: '1 / day each', pro: 'Unlimited' },
    rows: [
      { feature: 'JSON → CSV', free: '1 / day', pro: 'Unlimited' },
      { feature: 'CSV → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → YAML', free: '1 / day', pro: 'Unlimited' },
      { feature: 'YAML → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → XML', free: '1 / day', pro: 'Unlimited' },
      { feature: 'XML → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → SQL', free: '1 / day', pro: 'Unlimited' },
      { feature: 'SQL → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → Excel', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Excel → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → TypeScript', free: '1 / day', pro: 'Unlimited' },
      { feature: 'TypeScript → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → PHP', free: '1 / day', pro: 'Unlimited' },
      { feature: 'PHP → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → Markdown', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Markdown → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → HTML', free: '1 / day', pro: 'Unlimited' },
      { feature: 'HTML → JSON', free: '1 / day', pro: 'Unlimited' },
      { feature: 'JSON → TOML', free: '1 / day', pro: 'Unlimited' },
      { feature: 'TOML → JSON', free: '1 / day', pro: 'Unlimited' },
    ],
  },
  {
    category: 'Utilities',
    collapsible: true,
    summary: { free: '1 / day each', pro: 'Unlimited' },
    rows: [
      { feature: 'Diff', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Merge', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Query (JMESPath)', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Faker', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Generate Schema', free: '1 / day', pro: 'Unlimited' },
      { feature: 'Beautify / Compress / Validate', free: '1 / day', pro: 'Unlimited' },
    ],
  },
  {
    category: 'File Limits',
    rows: [
      { feature: 'Max file size', free: '5 MB', pro: 'Unlimited' },
      { feature: 'Files per batch', free: '1 file', pro: 'Up to 10 files' },
    ],
  },
];

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your billing dashboard and you keep access until the end of the current billing period. No questions asked.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 7-day refund on your first payment. Contact support within 7 days of being charged.',
  },
  {
    q: 'How is VAT / tax handled?',
    a: "Dodo Payments handles all tax calculation and collection automatically, including EU VAT. You don't need to configure anything.",
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — Pro includes a 14-day free trial, no card required. The trial starts when you first access a Pro feature.',
  },
  {
    q: 'Can I use the API on the Free plan?',
    a: 'API access is a paid feature. Upgrade to Pro or Business to get API tokens and start integrating I ❤️ JSON into your own applications.',
  },
  {
    q: 'What is the difference between Tools Pro and API Pro?',
    a: 'Tools Pro ($3/mo) unlocks all converter and utility tools plus batch processing. API Pro ($9/mo) gives you programmatic REST API access with rate limits and API tokens — ideal for developers automating workflows.',
  },
];

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function Check({ inline }) {
  return (
    <svg className={inline ? 'w-4 h-4 text-green-500 shrink-0' : 'w-5 h-5 text-green-500 mx-auto'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Minus() {
  return (
    <svg className="w-5 h-5 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
}

function CellValue({ val }) {
  if (val === true) return <Check />;
  if (val === false) return <Minus />;
  return <span className="text-sm text-foreground font-medium">{val}</span>;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function PricingPage({ paymentsEnabled, currentTier }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [openSections, setOpenSections] = useState(new Set());
  const [activeSection, setActiveSection] = useState('tools');

  function toggleSection(category) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  const { data: session } = useSession();
  const router = useRouter();

  const activeTierKey = currentTier ? currentTier.toLowerCase() : null;
  const activeTierOrder = activeTierKey != null ? (TIER_ORDER[activeTierKey] ?? -1) : -1;

  async function handleUpgrade(tier) {
    if (!paymentsEnabled) return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }
    setLoading(tier.key);
    setCheckoutError('');
    try {
      const planId = tier.planId[annual ? 'annual' : 'monthly'];
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
      setLoading(null);
    }
  }

  return (
    <Layout title="Pricing — I ❤️ JSON" description="Simple, transparent pricing. Free forever. Upgrade when you need more.">
      <Head>
        <meta property="og:title" content="Pricing — I ❤️ JSON" />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Free forever. Upgrade when you need more tools, batch processing, or API access.
          </p>
        </div>

        {/* Section tabs: Tools / API */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex bg-secondary/40 border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveSection('tools')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'tools'
                  ? 'bg-white shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setActiveSection('api')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'api'
                  ? 'bg-white shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              API Access
            </button>
          </div>
        </div>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-red-500' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual{' '}
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              Save ~33%
            </span>
          </span>
        </div>

        {checkoutError && (
          <p className="text-center text-sm text-red-500 -mt-6 mb-6">{checkoutError}</p>
        )}

        {/* ── TOOLS PRICING ─────────────────────────────────────────────── */}
        {activeSection === 'tools' && (
          <>
            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
              {TOOLS_TIERS.map(tier => (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl border-2 p-8 flex flex-col transition-shadow ${
                    tier.highlight
                      ? 'border-red-500 shadow-xl shadow-red-500/10 bg-card'
                      : 'border-border bg-card hover:shadow-md'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      {tier.badge}
                    </span>
                  )}

                  <div className="mb-5">
                    <div className="text-2xl mb-2">{tier.icon}</div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{tier.name}</h2>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    {tier.price.monthly === 0 ? (
                      <div>
                        <span className="text-4xl font-black text-foreground">Free</span>
                        <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-black text-foreground">
                            ${annual ? tier.price.annual : tier.price.monthly}
                          </span>
                          <span className="text-muted-foreground text-sm mb-1">/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {annual ? `Billed $${tier.price.annual * 12}/year` : 'Billed monthly'}
                        </p>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check inline />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {tier.key === 'tools_free' ? (
                    <a
                      href={tier.ctaHref}
                      className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${tier.btnClass}`}
                    >
                      {tier.cta}
                    </a>
                  ) : paymentsEnabled ? (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={loading === tier.key}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${tier.btnClass}`}
                    >
                      {loading === tier.key ? 'Redirecting…' : session ? tier.cta : 'Sign in to upgrade'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground cursor-not-allowed"
                    >
                      Coming soon
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Tools comparison table */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">Compare plans</h2>
              <div className="overflow-x-auto rounded-2xl border border-border max-w-2xl mx-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground w-1/2">Features</th>
                      <th className="px-4 py-4 text-center text-sm font-bold text-foreground w-1/4">
                        <div className="flex flex-col items-center gap-1">
                          <span>🆓</span>
                          <span>Free</span>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold text-red-500 w-1/4">
                        <div className="flex flex-col items-center gap-1">
                          <span>⚡</span>
                          <span>Pro</span>
                          <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">$3/mo</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOOLS_COMPARISON.map((section, si) => {
                      const isOpen = openSections.has('t_' + section.category);
                      return (
                        <Fragment key={section.category}>
                          <tr
                            className={`bg-secondary/20 ${section.collapsible ? 'cursor-pointer hover:bg-secondary/40 transition-colors select-none' : ''}`}
                            onClick={section.collapsible ? () => toggleSection('t_' + section.category) : undefined}
                          >
                            <td className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-2">
                                {section.collapsible && (
                                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                                {section.category}
                              </span>
                            </td>
                            {section.collapsible ? (
                              <>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2">
                                  {section.summary.free}
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 bg-red-500/5">
                                  {section.summary.pro}
                                </td>
                              </>
                            ) : (
                              <td colSpan={2} />
                            )}
                          </tr>
                          {(!section.collapsible || isOpen) && section.rows.map((row, ri) => (
                            <tr key={`${si}-${ri}`} className="border-t border-border/60 hover:bg-secondary/10 transition-colors">
                              <td className={`py-3.5 text-sm text-foreground ${section.collapsible ? 'pl-10 pr-6' : 'px-6'}`}>{row.feature}</td>
                              <td className="px-4 py-3.5 text-center">
                                <CellValue val={row.free} />
                              </td>
                              <td className="px-4 py-3.5 text-center bg-red-500/5">
                                <CellValue val={row.pro} />
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    <tr className="border-t-2 border-border bg-secondary/10">
                      <td className="px-6 py-5 text-sm font-semibold text-foreground">Get started</td>
                      <td className="px-4 py-5 text-center">
                        <a href="/" className="inline-block px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                          Start free
                        </a>
                      </td>
                      <td className="px-4 py-5 text-center bg-red-500/5">
                        {paymentsEnabled ? (
                          <button
                            onClick={() => handleUpgrade(TOOLS_TIERS[1])}
                            disabled={loading === 'tools_pro'}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                          >
                            {loading === 'tools_pro' ? '…' : 'Go Pro'}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Coming soon</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── API PRICING ───────────────────────────────────────────────── */}
        {activeSection === 'api' && (
          <>
            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {TIERS.map(tier => {
                const isActive = activeTierKey === tier.key;
                return (
                  <div
                    key={tier.key}
                    className={`relative rounded-2xl border-2 p-8 flex flex-col transition-shadow ${
                      isActive
                        ? 'border-green-500 shadow-xl shadow-green-500/10 bg-card'
                        : tier.highlight
                        ? 'border-red-500 shadow-xl shadow-red-500/10 bg-card'
                        : 'border-border bg-card hover:shadow-md'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                        ✓ Current plan
                      </span>
                    )}
                    {!isActive && tier.badge && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                        {tier.badge}
                      </span>
                    )}

                    <div className="mb-5">
                      <div className="text-2xl mb-2">{tier.icon}</div>
                      <h2 className="text-xl font-bold text-foreground mb-1">{tier.name}</h2>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>

                    <div className="mb-6">
                      {tier.price.monthly === 0 ? (
                        <div>
                          <span className="text-4xl font-black text-foreground">Free</span>
                          <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-end gap-1">
                            <span className="text-4xl font-black text-foreground">
                              ${annual ? tier.price.annual : tier.price.monthly}
                            </span>
                            <span className="text-muted-foreground text-sm mb-1">/month</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {annual ? `Billed $${tier.price.annual * 12}/year` : 'Billed monthly'}
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {tier.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check inline />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 text-center">
                        ✓ Your current plan
                      </div>
                    ) : activeTierOrder > TIER_ORDER[tier.key] ? (
                      <button
                        className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                        onClick={() => tier.key === 'free' ? window.location.href = '/dashboard/billing' : handleUpgrade(tier)}
                      >
                        Downgrade to {tier.name}
                      </button>
                    ) : tier.key === 'free' ? (
                      <a
                        href={tier.ctaHref}
                        className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${tier.btnClass}`}
                      >
                        {tier.cta}
                      </a>
                    ) : paymentsEnabled ? (
                      <button
                        onClick={() => handleUpgrade(tier)}
                        disabled={loading === tier.key}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${tier.btnClass}`}
                      >
                        {loading === tier.key ? 'Redirecting…' : session ? tier.cta : 'Sign in to upgrade'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground cursor-not-allowed"
                      >
                        Coming soon
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* API compare plans table */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">Compare plans</h2>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground w-1/2">Features</th>
                      {TIERS.map(tier => (
                        <th
                          key={tier.key}
                          className={`px-4 py-4 text-center text-sm font-bold w-[16.6%] ${
                            tier.highlight ? 'text-red-500' : 'text-foreground'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{tier.icon}</span>
                            <span>{tier.name}</span>
                            {tier.highlight && (
                              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                                Popular
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((section, si) => {
                      const isOpen = openSections.has(section.category);
                      return (
                        <Fragment key={section.category}>
                          <tr
                            className={`bg-secondary/20 ${section.collapsible ? 'cursor-pointer hover:bg-secondary/40 transition-colors select-none' : ''}`}
                            onClick={section.collapsible ? () => toggleSection(section.category) : undefined}
                          >
                            <td className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-2">
                                {section.collapsible && (
                                  <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                                {section.category}
                              </span>
                            </td>
                            {section.collapsible ? (
                              <>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2">
                                  {section.summary.free}
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 bg-red-500/5">
                                  {section.summary.pro}
                                </td>
                                <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2">
                                  {section.summary.business}
                                </td>
                              </>
                            ) : (
                              <td colSpan={3} />
                            )}
                          </tr>

                          {(!section.collapsible || isOpen) && section.rows.map((row, ri) => (
                            <tr
                              key={`${si}-${ri}`}
                              className="border-t border-border/60 hover:bg-secondary/10 transition-colors"
                            >
                              <td className={`py-3.5 text-sm text-foreground ${section.collapsible ? 'pl-10 pr-6' : 'px-6'}`}>
                                {row.feature}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <CellValue val={row.free} />
                              </td>
                              <td className="px-4 py-3.5 text-center bg-red-500/5">
                                <CellValue val={row.pro} />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <CellValue val={row.business} />
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}

                    <tr className="border-t-2 border-border bg-secondary/10">
                      <td className="px-6 py-5 text-sm font-semibold text-foreground">Get started</td>
                      {TIERS.map(tier => {
                        const isActive = activeTierKey === tier.key;
                        return (
                          <td key={tier.key} className={`px-4 py-5 text-center ${tier.highlight ? 'bg-red-500/5' : ''}`}>
                            {isActive ? (
                              <span className="inline-block px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
                                Current plan
                              </span>
                            ) : tier.key === 'free' ? (
                              <a
                                href={tier.ctaHref}
                                className="inline-block px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                              >
                                {tier.cta}
                              </a>
                            ) : paymentsEnabled ? (
                              <button
                                onClick={() => handleUpgrade(tier)}
                                disabled={loading === tier.key}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${tier.btnClass}`}
                              >
                                {loading === tier.key ? '…' : tier.cta}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Coming soon</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-foreground select-none list-none hover:bg-secondary/30 transition-colors">
                  {q}
                  <svg
                    className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 pt-1 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  let currentTier = null;
  if (session?.user?.id) {
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { tier: true, status: true },
    });
    if (sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING')) {
      currentTier = sub.tier;
    }
  }

  return {
    props: {
      paymentsEnabled: !!process.env.DODO_API_KEY,
      currentTier,
    },
  };
}
