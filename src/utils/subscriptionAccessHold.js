/**
 * Payment hold / missing subscription detection for view APIs.
 * Matches Cloud web: HTTP 403 with SUBSCRIPTION_ON_HOLD | SUBSCRIPTION_REQUIRED.
 */

export const SUBSCRIPTION_REQUIRED_MESSAGE = 'An active subscription is required.';

const SUBSCRIPTION_ACCESS_DENIED_CODES = new Set([
  'SUBSCRIPTION_ON_HOLD',
  'SUBSCRIPTION_REQUIRED',
]);

/**
 * True when a product/view API rejected access due to hold or missing subscription.
 * Accepts LG ApiError ({ status, code, data }) and axios-like shapes.
 */
export function isSubscriptionAccessDeniedError(error) {
  const status = Number(error?.status ?? error?.response?.status);
  if (status !== 403) {
    return false;
  }
  const code = String(
    error?.data?.code
      || error?.code
      || error?.response?.data?.code
      || ''
  ).trim().toUpperCase();
  return SUBSCRIPTION_ACCESS_DENIED_CODES.has(code);
}
