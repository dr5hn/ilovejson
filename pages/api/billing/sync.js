import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { getDodoClient } from '@lib/dodo';
import prisma from '@lib/prisma';

export const config = { api: { bodyParser: true } };

const PRO_IDS = [
  process.env.DODO_PRO_MONTHLY_PRICE_ID,
  process.env.DODO_PRO_ANNUAL_PRICE_ID,
];
const BUSINESS_IDS = [
  process.env.DODO_BUSINESS_MONTHLY_PRICE_ID,
  process.env.DODO_BUSINESS_ANNUAL_PRICE_ID,
];

function tierFromProductId(productId) {
  if (PRO_IDS.includes(productId)) return 'PRO';
  if (BUSINESS_IDS.includes(productId)) return 'BUSINESS';
  return 'FREE';
}

function mapStatus(dodoStatus) {
  const map = {
    active:    'ACTIVE',
    trialing:  'TRIALING',
    on_hold:   'PAST_DUE',
    cancelled: 'CANCELED',
    expired:   'EXPIRED',
    pending:   'ACTIVE',
    failed:    'PAST_DUE',
  };
  return map[dodoStatus] ?? 'ACTIVE';
}

async function findDodoSubscriptions(dodo, existing, email, subscriptionId) {
  // 1. Use subscription_id passed directly from Dodo's return URL (most reliable)
  if (subscriptionId) {
    const sub = await dodo.subscriptions.retrieve(subscriptionId).catch(() => null);
    if (sub) return [sub];
  }

  // 2. Try by stored customer ID
  if (existing?.dodoCustomerId) {
    const page = await dodo.subscriptions.list({ customer_id: existing.dodoCustomerId });
    if (page.items?.length) return page.items;
  }

  // 3. Try by stored subscription ID
  if (existing?.dodoSubscriptionId) {
    const sub = await dodo.subscriptions.retrieve(existing.dodoSubscriptionId).catch(() => null);
    if (sub) return [sub];
  }

  // 4. Look up customer by email then list their subscriptions
  if (email) {
    const customers = await dodo.customers.list({ email });
    const customer = customers.items?.[0];
    if (customer?.customer_id) {
      const page = await dodo.subscriptions.list({ customer_id: customer.customer_id });
      return page.items ?? [];
    }
  }

  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'unauthenticated' });

  const dodo = getDodoClient();
  if (!dodo) return res.status(200).json({ synced: false, reason: 'payments_disabled' });

  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { dodoCustomerId: true, dodoSubscriptionId: true },
    });

    const { subscriptionId } = req.body || {};
    const subs = await findDodoSubscriptions(dodo, existing, session.user.email, subscriptionId);

    // Prefer active/trialing over any other status
    const active = subs.find(s => ['active', 'trialing', 'pending'].includes(s.status))
      ?? subs.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))[0];

    if (!active) {
      return res.status(200).json({ synced: false, reason: 'no_subscription_found' });
    }

    const tier   = tierFromProductId(active.product_id);
    const status = mapStatus(active.status);
    const customerId = active.customer?.customer_id ?? existing?.dodoCustomerId ?? null;

    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        tier,
        status,
        dodoSubscriptionId: active.subscription_id,
        dodoCustomerId:     customerId,
        currentPeriodStart: active.current_period_start ? new Date(active.current_period_start) : undefined,
        currentPeriodEnd:   active.current_period_end   ? new Date(active.current_period_end)   : undefined,
        cancelAtPeriodEnd:  active.cancel_at_period_end ?? false,
      },
      create: {
        userId: session.user.id,
        tier,
        status,
        dodoSubscriptionId: active.subscription_id,
        dodoCustomerId:     customerId,
        currentPeriodStart: active.current_period_start ? new Date(active.current_period_start) : null,
        currentPeriodEnd:   active.current_period_end   ? new Date(active.current_period_end)   : null,
        cancelAtPeriodEnd:  active.cancel_at_period_end ?? false,
      },
    });

    return res.status(200).json({ synced: true, tier, status });
  } catch (err) {
    console.error('[billing/sync]', err.message);
    return res.status(500).json({ error: 'sync_failed', detail: err.message });
  }
}
