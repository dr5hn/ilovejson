import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'I ❤️ JSON <noreply@ilovejson.com>';
const APP_URL = process.env.NEXTAUTH_URL || 'https://www.ilovejson.com';

async function send(to, subject, html) {
  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html }).catch(() => {});
}

function btn(text, url) {
  return `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${text}</a>`;
}

export async function sendSubscriptionActivated(email, tier) {
  await send(email, `Welcome to I ❤️ JSON ${tier}!`,
    `<p>Your <strong>${tier}</strong> subscription is now active. Enjoy the upgraded limits!</p>
     <p>${btn('Go to Dashboard', `${APP_URL}/dashboard/billing`)}</p>`);
}

export async function sendPaymentSucceeded(email, tier, amount) {
  await send(email, 'Payment received – I ❤️ JSON',
    `<p>Thanks for your payment of <strong>${amount}</strong>. Your <strong>${tier}</strong> subscription continues uninterrupted.</p>
     <p>${btn('View Billing', `${APP_URL}/dashboard/billing`)}</p>`);
}

export async function sendPaymentFailed(email, portalUrl) {
  await send(email, 'Action required: payment failed – I ❤️ JSON',
    `<p>We couldn't process your latest payment. Please update your payment method to avoid losing access.</p>
     <p>${btn('Update Payment Method', portalUrl || `${APP_URL}/dashboard/billing`)}</p>`);
}

export async function sendCancelingAtPeriodEnd(email, date) {
  await send(email, 'Your subscription will cancel – I ❤️ JSON',
    `<p>Your subscription is set to cancel on <strong>${new Date(date).toLocaleDateString()}</strong>. You'll keep access until then.</p>
     <p>${btn('Manage Subscription', `${APP_URL}/dashboard/billing`)}</p>`);
}

export async function sendSubscriptionExpired(email) {
  await send(email, 'Your subscription has expired – I ❤️ JSON',
    `<p>Your paid subscription has ended and your account has been moved to the Free tier. Upgrade anytime to regain access to pro features.</p>
     <p>${btn('View Plans', `${APP_URL}/pricing`)}</p>`);
}

export async function sendTrialStarted(email, endsAt) {
  await send(email, 'Your 14-day Pro trial has started – I ❤️ JSON',
    `<p>Your free trial of I ❤️ JSON Pro starts now and ends on <strong>${new Date(endsAt).toLocaleDateString()}</strong>. No card required.</p>
     <p>${btn('Explore Pro Features', `${APP_URL}/dashboard`)}</p>`);
}

export async function sendTrialEndingSoon(email, endsAt) {
  await send(email, 'Your trial ends in 3 days – I ❤️ JSON',
    `<p>Your Pro trial expires on <strong>${new Date(endsAt).toLocaleDateString()}</strong>. Subscribe now to keep your access.</p>
     <p>${btn('Upgrade to Pro', `${APP_URL}/pricing`)}</p>`);
}

export async function sendTrialExpired(email) {
  await send(email, 'Your trial has ended – I ❤️ JSON',
    `<p>Your 14-day Pro trial has ended and your account is now on the Free tier. Upgrade anytime.</p>
     <p>${btn('View Plans', `${APP_URL}/pricing`)}</p>`);
}

export async function sendTokensRevoked(email, count) {
  await send(email, `${count} API token(s) revoked due to plan change – I ❤️ JSON`,
    `<p>Your plan change reduced the API token limit. We revoked <strong>${count}</strong> least-recently-used token(s) to comply with your new tier.</p>
     <p>${btn('Manage Tokens', `${APP_URL}/dashboard/api-tokens`)}</p>`);
}
