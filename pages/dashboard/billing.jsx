import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import prisma from '@lib/prisma';

const TIER_LABELS = { FREE: 'Free', PRO: 'Pro', BUSINESS: 'Business' };
const STATUS_LABELS = {
  ACTIVE: 'Active',
  TRIALING: 'Trial',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceling',
  EXPIRED: 'Expired',
};

const TIER_RANK = { FREE: 0, PRO: 1, BUSINESS: 2 };

const PLANS = [
  {
    key: 'FREE',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Everything you need to get started.',
    features: ['100 MB max upload size', '30-day conversion history', 'All conversion & utility tools', 'Unlimited anonymous usage'],
    missing: ['API access', 'Priority support'],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: { monthly: 9, annual: 7 },
    planId: { monthly: 'pro_monthly', annual: 'pro_annual' },
    description: 'For power users who need more headroom.',
    badge: 'Most popular',
    features: ['500 MB max upload size', '1-year conversion history', 'API access (60 req/min, 10 000/day)', 'Up to 3 API tokens', 'Email support'],
    missing: [],
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    price: { monthly: 49, annual: 41 },
    planId: { monthly: 'business_monthly', annual: 'business_annual' },
    description: 'For teams with high-volume needs.',
    features: ['2 GB max upload size', 'Unlimited conversion history', 'API access (600 req/min, 1M/day)', 'Unlimited API tokens', 'Priority email support (24 h)'],
    missing: [],
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

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BillingPage({ subscription: initialSubscription, paymentsEnabled }) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [billingError, setBillingError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const { status, subscription_id } = router.query;
    const statuses = Array.isArray(status) ? status : [status];
    if (!statuses.includes('success') && !subscription_id) return;

    setSyncing(true);
    fetch('/api/billing/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subscription_id ?? null }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.synced) {
          router.replace('/dashboard/billing', undefined, { shallow: false });
        }
      })
      .finally(() => setSyncing(false));
  }, [router.query.subscription_id, router.query.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const tier = subscription?.tier ?? 'FREE';
  const status = subscription?.status ?? 'ACTIVE';
  const isPaid = tier !== 'FREE';
  const isPastDue = status === 'PAST_DUE';

  async function goToCheckout(plan) {
    setLoadingPlan(plan);
    setBillingError('');
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError('Could not start checkout. Please try again.');
      }
    } catch {
      setBillingError('Network error. Please check your connection and try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  async function goToPortal() {
    setLoadingPortal(true);
    setBillingError('');
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError('Could not open customer portal. Please try again.');
      }
    } catch {
      setBillingError('Network error. Please check your connection and try again.');
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <DashboardLayout title="Billing" description="Manage your subscription and billing">
      <div className="space-y-6">

        {/* Syncing banner after checkout redirect */}
        {syncing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Activating your subscription…
          </div>
        )}

        {billingError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {billingError}
          </div>
        )}

        {/* Past due banner */}
        {isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-700 text-sm">Payment failed</p>
              <p className="text-sm text-red-600 mt-0.5">Your last payment couldn&apos;t be processed. Update your payment method to avoid losing access.</p>
              {paymentsEnabled && (
                <button onClick={goToPortal} disabled={loadingPortal} className="mt-2 text-sm font-semibold text-red-600 underline hover:text-red-800 disabled:opacity-60">
                  {loadingPortal ? 'Redirecting…' : 'Update payment method'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Current plan */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-foreground">{TIER_LABELS[tier]}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  status === 'TRIALING' ? 'bg-blue-100 text-blue-700' :
                  status === 'PAST_DUE' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>{STATUS_LABELS[status] ?? status}</span>
              </div>

              {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
                <p className="text-sm text-orange-600 mt-1">
                  Cancels on {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
              {!subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>

            {paymentsEnabled && isPaid && (
              <button
                onClick={goToPortal}
                disabled={loadingPortal}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {loadingPortal ? 'Redirecting…' : 'Manage subscription'}
              </button>
            )}
          </div>
        </div>

        {/* Plan comparison */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isCurrent = plan.key === tier;
              const isUpgrade = TIER_RANK[plan.key] > TIER_RANK[tier];
              const isDowngrade = TIER_RANK[plan.key] < TIER_RANK[tier] && plan.key !== 'FREE';
              const isPopular = plan.key === 'PRO';

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    isCurrent
                      ? 'border-green-500 shadow-lg shadow-green-500/10 bg-card'
                      : isPopular && !isCurrent
                      ? 'border-red-400 shadow-lg shadow-red-500/10 bg-card'
                      : 'border-border bg-card'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      Current plan
                    </span>
                  )}
                  {!isCurrent && isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      Most popular
                    </span>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground mb-0.5">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    {plan.price.monthly === 0 ? (
                      <span className="text-3xl font-black text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-foreground">${plan.price.monthly}</span>
                        <span className="text-muted-foreground text-sm ml-1">/month</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check />{f}
                      </li>
                    ))}
                    {plan.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                        <Cross />{f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 text-center">
                      ✓ Your current plan
                    </div>
                  ) : plan.key === 'FREE' ? (
                    <button
                      onClick={goToPortal}
                      disabled={loadingPortal || !paymentsEnabled}
                      className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      {loadingPortal ? 'Redirecting…' : 'Downgrade to Free'}
                    </button>
                  ) : isUpgrade ? (
                    paymentsEnabled ? (
                      <button
                        onClick={() => goToCheckout(plan.planId.monthly)}
                        disabled={!!loadingPlan}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                          isPopular ? 'bg-red-500 text-white hover:bg-red-600' : 'border border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        {loadingPlan === plan.planId.monthly ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                      </button>
                    ) : (
                      <button disabled className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground cursor-not-allowed">
                        Coming soon
                      </button>
                    )
                  ) : isDowngrade ? (
                    <button
                      onClick={goToPortal}
                      disabled={loadingPortal || !paymentsEnabled}
                      className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      {loadingPortal ? 'Redirecting…' : `Downgrade to ${plan.name}`}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan limits summary */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your plan limits</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Max upload', value: tier === 'FREE' ? '100 MB' : tier === 'PRO' ? '500 MB' : '2 GB' },
              { label: 'History', value: tier === 'FREE' ? '30 days' : tier === 'PRO' ? '1 year' : 'Unlimited' },
              { label: 'API access', value: tier === 'FREE' ? 'None' : 'Enabled' },
              { label: 'API rate limit', value: tier === 'FREE' ? '—' : tier === 'PRO' ? '60/min, 10K/day' : '600/min, 1M/day' },
              { label: 'API tokens', value: tier === 'FREE' ? '0' : tier === 'PRO' ? '3' : 'Unlimited' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-lg px-4 py-3">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className="font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      tier: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      dodoCustomerId: true,
    },
  });

  return {
    props: {
      subscription: subscription ? JSON.parse(JSON.stringify(subscription)) : null,
      paymentsEnabled: !!process.env.DODO_API_KEY,
    },
  };
}
