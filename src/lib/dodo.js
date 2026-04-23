import DodoPayments from 'dodopayments';

let _client = null;

export function getDodoClient() {
  if (!process.env.DODO_API_KEY) return null;
  if (_client) return _client;
  _client = new DodoPayments({
    bearerToken: process.env.DODO_API_KEY,
    environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
  });
  return _client;
}

export const PLAN_PRICE_IDS = {
  pro_monthly:      () => process.env.DODO_PRO_MONTHLY_PRICE_ID,
  pro_annual:       () => process.env.DODO_PRO_ANNUAL_PRICE_ID,
  business_monthly: () => process.env.DODO_BUSINESS_MONTHLY_PRICE_ID,
  business_annual:  () => process.env.DODO_BUSINESS_ANNUAL_PRICE_ID,
};

export function isDodoEnabled() {
  return !!process.env.DODO_API_KEY;
}
