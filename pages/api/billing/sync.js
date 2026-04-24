import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { getDodoClient, TOOLS_PRO_IDS } from '@lib/dodo';
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

function classifySubscription(sub) {
  if (TOOLS_PRO_IDS.includes(sub.product_id)) return 'tools';
  if (PRO_IDS.includes(sub.product_id) || BUSINESS_IDS.includes(sub.product_id)) return 'api';
  return null;
}

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

function isActiveSub(s) {
  return ['active', 'trialing', 'pending'].includes(s.status);
}

function pickBest(subs) {
  return (
    subs.find(isActiveSub) ??
    subs.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))[0]
  );
}

async function findDodoSubscriptions(dodo, existing, email, subscriptionId) {
  // 1. Use subscription_id passed directly from Dodo's return URL (most reliable)
  if (subscriptionId) {
    const sub = await dodo.subscriptions.retrieve(subscriptionId).catch(() => null);
    if (sub) return [sub];
  }

  // 2. Try by stored customer ID (returns all subscriptions for that customer)
  if (existing?.dodoCustomerId) {
    const page = await dodo.subscriptions.list({ customer_id: existing.dodoCustomerId });
    if (page.items?.length) return page.items;
  }

  // 3. Try by stored API subscription ID
  const found = [];
  if (existing?.dodoSubscriptionId) {
    const sub = await dodo.subscriptions.retrieve(existing.dodoSubscriptionId).catch(() => null);
    if (sub) found.push(sub);
  }

  // 4. Try by stored tools subscription ID
  if (existing?.toolsDodoSubscriptionId) {
    const sub = await dodo.subscriptions.retrieve(existing.toolsDodoSubscriptionId).catch(() => null);
    if (sub && !found.find(f => f.subscription_id === sub.subscription_id)) found.push(sub);
  }

  if (found.length) return found;

  // 5. Look up customer by email then list their subscriptions
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
      select: { dodoCustomerId: true, dodoSubscriptionId: true, toolsDodoSubscriptionId: true },
    });

    const { subscriptionId } = req.body || {};
    const subs = await findDodoSubscriptions(dodo, existing, session.user.email, subscriptionId);

    const apiSubs   = subs.filter(s => classifySubscription(s) === 'api');
    const toolsSubs = subs.filter(s => classifySubscription(s) === 'tools');

    const bestApiSub   = pickBest(apiSubs);
    const bestToolsSub = pickBest(toolsSubs);

    if (!bestApiSub && !bestToolsSub) {
      return res.status(200).json({ synced: false, reason: 'no_subscription_found' });
    }

    const updateData = {};
    const createData = { userId: session.user.id };

    if (bestApiSub) {
      const tier       = tierFromProductId(bestApiSub.product_id);
      const status     = mapStatus(bestApiSub.status);
      const customerId = bestApiSub.customer?.customer_id ?? existing?.dodoCustomerId ?? null;

      Object.assign(updateData, {
        tier,
        status,
        dodoSubscriptionId:  bestApiSub.subscription_id,
        dodoCustomerId:      customerId,
        currentPeriodStart:  bestApiSub.current_period_start ? new Date(bestApiSub.current_period_start) : undefined,
        currentPeriodEnd:    bestApiSub.current_period_end   ? new Date(bestApiSub.current_period_end)   : undefined,
        cancelAtPeriodEnd:   bestApiSub.cancel_at_period_end ?? false,
      });
      Object.assign(createData, {
        tier,
        status,
        dodoSubscriptionId:  bestApiSub.subscription_id,
        dodoCustomerId:      customerId,
        currentPeriodStart:  bestApiSub.current_period_start ? new Date(bestApiSub.current_period_start) : null,
        currentPeriodEnd:    bestApiSub.current_period_end   ? new Date(bestApiSub.current_period_end)   : null,
        cancelAtPeriodEnd:   bestApiSub.cancel_at_period_end ?? false,
      });
    }

    if (bestToolsSub) {
      const toolsTierValue = isActiveSub(bestToolsSub) ? 'PRO' : 'FREE';
      Object.assign(updateData, {
        toolsTier:               toolsTierValue,
        toolsDodoSubscriptionId: bestToolsSub.subscription_id,
      });
      Object.assign(createData, {
        toolsTier:               toolsTierValue,
        toolsDodoSubscriptionId: bestToolsSub.subscription_id,
      });
    }

    // Strip undefined values so Prisma doesn't treat them as explicit sets
    const cleanUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined),
    );

    await prisma.subscription.upsert({
      where:  { userId: session.user.id },
      update: cleanUpdate,
      create: createData,
    });

    return res.status(200).json({
      synced:    true,
      tier:      updateData.tier     ?? null,
      toolsTier: updateData.toolsTier ?? null,
      status:    updateData.status   ?? null,
    });
  } catch (err) {
    console.error('[billing/sync]', err.message);
    return res.status(500).json({ error: 'sync_failed', detail: err.message });
  }
}
