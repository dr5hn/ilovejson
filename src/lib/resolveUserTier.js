import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';

/**
 * Resolve the subscription tier for the current request.
 * Returns 'FREE', 'PRO', or 'BUSINESS'.
 *
 * Checks NextAuth session only (legacy file-upload routes don't use API tokens).
 * Anonymous requests short-circuit to FREE with no DB query.
 */
export async function resolveUserTier(req, res) {
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch {
    return 'FREE';
  }

  if (!session?.user?.id) return 'FREE';

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { tier: true, status: true },
    });
    if (sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING')) {
      return sub.tier; // 'FREE' | 'PRO' | 'BUSINESS'
    }
  } catch {
    // DB error — fail open, treat as FREE
  }

  return 'FREE';
}
