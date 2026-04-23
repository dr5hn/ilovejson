import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@components/layout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Everything you need to get started.',
    cta: 'Start free',
    ctaHref: '/',
    highlight: false,
    features: [
      '100 MB max upload size',
      '30-day conversion history',
      'All conversion & utility tools',
      'Unlimited anonymous usage',
    ],
    missing: ['API access', 'Priority support'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: { monthly: 9, annual: 7 },
    planId: { monthly: 'pro_monthly', annual: 'pro_annual' },
    description: 'For power users who need more headroom.',
    cta: 'Upgrade to Pro',
    highlight: true,
    badge: 'Most popular',
    features: [
      '500 MB max upload size',
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
    cta: 'Upgrade to Business',
    highlight: false,
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
    a: 'Yes — Pro includes a 14-day free trial, no card required. The trial starts when you first access a Pro feature (like API tokens).',
  },
];

function Check() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default function PricingPage({ paymentsEnabled, currentTier }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const { data: session } = useSession();
  const router = useRouter();

  const activeTierKey = currentTier ? currentTier.toLowerCase() : null;

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Free forever. Upgrade when you need bigger uploads, longer history, or API access.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-red-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual <span className="text-green-600 font-semibold">~17% off</span>
            </span>
          </div>
        </div>

        {checkoutError && (
          <p className="text-center text-sm text-red-500 -mt-6 mb-2">{checkoutError}</p>
        )}

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {TIERS.map(tier => {
            const isActive = activeTierKey === tier.key;
            return (
            <div
              key={tier.key}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                isActive
                  ? 'border-green-500 shadow-xl shadow-green-500/10 bg-card'
                  : tier.highlight
                  ? 'border-red-500 shadow-xl shadow-red-500/10 bg-card'
                  : 'border-border bg-card'
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  Current plan
                </span>
              )}
              {!isActive && tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {tier.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">{tier.name}</h2>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="mb-8">
                {tier.price.monthly === 0 ? (
                  <span className="text-4xl font-black text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-black text-foreground">
                      ${annual ? tier.price.annual : tier.price.monthly}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/month</span>
                    {annual && (
                      <p className="text-xs text-green-600 mt-1">Billed annually</p>
                    )}
                  </>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check />
                    {f}
                  </li>
                ))}
                {tier.missing.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                    <Cross />
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 text-center">
                  ✓ Your current plan
                </div>
              ) : tier.key === 'free' ? (
                <a
                  href={tier.ctaHref}
                  className="block w-full text-center py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {tier.cta}
                </a>
              ) : paymentsEnabled ? (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loading === tier.key}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                    tier.highlight
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'border border-border text-foreground hover:bg-secondary'
                  }`}
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

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group border border-border rounded-xl">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-foreground select-none list-none">
                  {q}
                  <svg className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>
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
