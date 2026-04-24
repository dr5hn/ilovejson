import { Webhook } from 'dodopayments/webhooks';
import prisma from '@lib/prisma';
import {
  sendSubscriptionActivated,
  sendPaymentSucceeded,
  sendPaymentFailed,
  sendCancelingAtPeriodEnd,
  sendSubscriptionExpired,
  sendTrialExpired,
  sendTokensRevoked,
} from '@lib/email';
import { TIER_ENTITLEMENTS } from '@lib/entitlements';

// Raw body required for signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function tierFromProductId(productId) {
  const pro = [
    process.env.DODO_PRO_MONTHLY_PRICE_ID,
    process.env.DODO_PRO_ANNUAL_PRICE_ID,
  ];
  const biz = [
    process.env.DODO_BUSINESS_MONTHLY_PRICE_ID,
    process.env.DODO_BUSINESS_ANNUAL_PRICE_ID,
  ];
  if (pro.includes(productId)) return 'PRO';
  if (biz.includes(productId)) return 'BUSINESS';
  return 'FREE';
}

async function handleEvent(event) {
  const { type, data } = event;

  // Idempotency — skip already-processed events
  const existing = await prisma.paymentEvent.findUnique({
    where: { dodoEventId: event.webhookId },
  });
  if (existing) return;

  const subId = data.subscriptionId ?? data.subscription_id ?? null;
  const customerId = data.customerId ?? data.customer_id ?? null;

  // Find subscription by dodoSubscriptionId or customerId
  let sub = subId
    ? await prisma.subscription.findUnique({ where: { dodoSubscriptionId: subId }, include: { user: { select: { id: true, email: true } } } })
    : null;

  // Metadata userId fallback (present on initial checkout)
  const metaUserId = data.metadata?.userId ?? null;
  const userId = sub?.userId ?? metaUserId ?? null;

  const user = sub?.user ?? (userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }) : null);

  // Record event first (idempotency guard)
  await prisma.paymentEvent.create({
    data: {
      dodoEventId: event.webhookId,
      userId,
      eventType: type,
      payload: event,
    },
  });

  switch (type) {
    case 'subscription.created':
    case 'subscription.activated': {
      const tier = tierFromProductId(data.productId ?? data.product_id);
      const upsertData = {
        tier,
        status: 'ACTIVE',
        dodoSubscriptionId: subId,
        dodoCustomerId: customerId,
        currentPeriodStart: data.currentPeriodStart ? new Date(data.currentPeriodStart) : null,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: false,
      };
      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          update: upsertData,
          create: { userId, ...upsertData },
        });
      }
      if (user?.email) await sendSubscriptionActivated(user.email, tier);
      break;
    }

    case 'subscription.renewed': {
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: data.currentPeriodStart ? new Date(data.currentPeriodStart) : undefined,
            currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
          },
        });
      }
      const amount = data.amount ? `$${(data.amount / 100).toFixed(2)}` : '';
      if (user?.email) await sendPaymentSucceeded(user.email, sub?.tier ?? 'PRO', amount);
      break;
    }

    case 'subscription.payment_failed': {
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'PAST_DUE' },
        });
      }
      const portalUrl = data.customerPortalUrl ?? null;
      if (user?.email) await sendPaymentFailed(user.email, portalUrl);
      break;
    }

    case 'subscription.canceled': {
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            cancelAtPeriodEnd: true,
            status: 'CANCELED',
          },
        });
      }
      if (user?.email && sub?.currentPeriodEnd) await sendCancelingAtPeriodEnd(user.email, sub.currentPeriodEnd);
      break;
    }

    case 'subscription.expired': {
      if (sub) {
        const oldTier = sub.tier;
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { tier: 'FREE', status: 'EXPIRED', dodoSubscriptionId: null },
        });

        // Downgrade: revoke excess API tokens
        if (oldTier !== 'FREE' && userId) {
          await revokeExcessTokens(userId, 0, user?.email);
        }
      }
      if (user?.email) await sendSubscriptionExpired(user.email);
      break;
    }

    case 'subscription.trial_started': {
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'TRIALING',
            currentPeriodEnd: data.trialEnd ? new Date(data.trialEnd) : undefined,
          },
        });
      }
      break;
    }

    default:
      break;
  }
}

async function revokeExcessTokens(userId, tokenLimit, email) {
  if (tokenLimit === null) return; // unlimited
  const tokens = await prisma.apiToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastUsedAt: { sort: 'desc', nulls: 'last' } },
  });
  if (tokens.length <= tokenLimit) return;
  const toRevoke = tokens.slice(tokenLimit);
  await prisma.apiToken.updateMany({
    where: { id: { in: toRevoke.map(t => t.id) } },
    data: { revokedAt: new Date() },
  });
  if (email) await sendTokensRevoked(email, toRevoke.length);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.DODO_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'webhook_secret_not_configured' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['webhook-signature'] ?? req.headers['x-dodo-signature'] ?? '';

  let event;
  try {
    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET);
    event = wh.verify(rawBody, { 'webhook-signature': signature });
  } catch {
    return res.status(401).json({ error: 'invalid_signature' });
  }

  try {
    await handleEvent(event);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[dodo webhook]', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}
