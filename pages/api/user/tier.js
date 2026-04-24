import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(200).json({ tier: 'FREE', toolsTier: 'FREE', loggedIn: false });
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { tier: true, status: true, toolsTier: true },
    });

    const active    = sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING');
    const tier      = active ? sub.tier      : 'FREE';
    const toolsTier = active ? sub.toolsTier : 'FREE';

    return res.status(200).json({ tier, toolsTier, loggedIn: true });
  } catch {
    return res.status(200).json({ tier: 'FREE', toolsTier: 'FREE', loggedIn: false });
  }
}
