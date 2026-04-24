import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { getDodoClient } from '@lib/dodo';
import prisma from '@lib/prisma';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'unauthenticated' });

  const dodo = getDodoClient();
  if (!dodo) return res.status(503).json({ error: 'payments_unavailable' });

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { dodoCustomerId: true },
  });

  if (!sub?.dodoCustomerId) {
    return res.status(404).json({ error: 'no_subscription' });
  }

  try {
    const portal = await dodo.customers.customerPortal.create(sub.dodoCustomerId);
    return res.status(200).json({ url: portal.link });
  } catch (err) {
    console.error('[billing/portal]', err.message);
    return res.status(500).json({ error: 'portal_failed' });
  }
}
