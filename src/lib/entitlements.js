import prisma from '@lib/prisma';

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const TIER_ENTITLEMENTS = {
  FREE: {
    storageCapBytes: 100 * MB,
    maxUploadBytes: 100 * MB,
    historyRetentionDays: 30,
    apiEnabled: false,
    apiRateLimit: { perMinute: 0, perDay: 0 },
    apiTokenLimit: 0,
  },
  PRO: {
    storageCapBytes: 10 * GB,
    maxUploadBytes: 500 * MB,
    historyRetentionDays: 365,
    apiEnabled: true,
    apiRateLimit: { perMinute: 60, perDay: 10000 },
    apiTokenLimit: 3,
  },
  BUSINESS: {
    storageCapBytes: 100 * GB,
    maxUploadBytes: 2 * GB,
    historyRetentionDays: null,
    apiEnabled: true,
    apiRateLimit: { perMinute: 600, perDay: 1000000 },
    apiTokenLimit: null,
  },
};

export async function getEntitlements(userId) {
  if (!userId) return TIER_ENTITLEMENTS.FREE;

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true },
  });

  const active = sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING');
  const tier = active ? sub.tier : 'FREE';

  return TIER_ENTITLEMENTS[tier] ?? TIER_ENTITLEMENTS.FREE;
}
