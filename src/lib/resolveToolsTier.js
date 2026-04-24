import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';

export async function resolveToolsTier(req, res) {
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
      select: { toolsTier: true },
    });
    return sub?.toolsTier ?? 'FREE';
  } catch {
    return 'FREE';
  }
}
