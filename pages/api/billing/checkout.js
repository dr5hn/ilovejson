import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { getDodoClient, PLAN_PRICE_IDS } from '@lib/dodo';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'unauthenticated' });

  const dodo = getDodoClient();
  if (!dodo) return res.status(503).json({ error: 'payments_unavailable' });

  const { plan } = req.body;
  const getPriceId = PLAN_PRICE_IDS[plan];
  if (!getPriceId) return res.status(400).json({ error: 'invalid_plan' });

  const priceId = getPriceId();
  if (!priceId) return res.status(400).json({ error: 'plan_not_configured' });

  const appUrl = process.env.NEXTAUTH_URL || 'https://www.ilovejson.com';

  try {
    const checkout = await dodo.subscriptions.create({
      billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
      customer: { email: session.user.email, name: session.user.name || session.user.email },
      product_id: priceId,
      quantity: 1,
      payment_link: true,
      return_url: `${appUrl}/dashboard/billing?status=success`,
      metadata: { userId: session.user.id },
    });

    return res.status(200).json({ url: checkout.payment_link });
  } catch (err) {
    console.error('[billing/checkout]', err.message);
    return res.status(500).json({ error: 'checkout_failed' });
  }
}
