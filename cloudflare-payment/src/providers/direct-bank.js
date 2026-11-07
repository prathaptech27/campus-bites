/**
 * Direct-bank adapter contract for CampusBites.
 *
 * There is no universal Indian bank merchant API. Implement this adapter only
 * against the acquiring bank's written API specification and approved merchant
 * credentials. Never treat a UPI intent/deep link or client redirect as proof
 * of payment. The bank must provide a signed webhook and/or server-side status API.
 *
 * Normalized contract expected by the payment router:
 *   createPayment({merchantReference, amountPaise, currency, orderId, returnUrl})
 *     -> {bankPaymentId, checkoutUrl}
 *   verifyPayment(bankPaymentId)
 *     -> {status:"CAPTURED"|"PENDING"|"FAILED", amountPaise, currency, merchantReference}
 *   verifyWebhook(rawBody, signature)
 *     -> verified event object
 *
 * This module intentionally fails closed until a bank-specific implementation
 * is supplied. Do not replace this with static QR/UTR screenshot verification.
 */
export class DirectBankAdapter {
  constructor(env) { this.env = env; }
  assertConfigured() {
    throw new Error(
      "Direct bank integration is not configured. Obtain the bank's merchant API specification, credentials, webhook signing rules and production approval, then implement this adapter."
    );
  }
  async createPayment() { this.assertConfigured(); }
  async verifyPayment() { this.assertConfigured(); }
  async verifyWebhook() { this.assertConfigured(); }
}
