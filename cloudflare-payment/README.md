# Campus Bites — Razorpay + Cloudflare Worker

This adds a server-side payment verification layer. It deliberately **does not enable checkout by default**.

## Why Cloudflare Workers + D1

- Workers Free currently includes 100,000 requests/day; D1 has a free tier for prototyping. Limits apply and requests fail when free D1 quotas are exhausted.
- Razorpay secrets remain in Worker secrets, never in `index.html`.
- The Worker creates Razorpay Orders, verifies Checkout HMAC signatures, fetches payment status from Razorpay, and accepts signed webhooks.
- Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 FAQ](https://developers.cloudflare.com/d1/reference/faq/), [Razorpay integration steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

## Critical production blocker: authoritative prices and identity

The legacy Campus Bites app calculates item prices and student identity in browser JavaScript/local storage. A user can modify those values using browser developer tools. The Worker therefore currently receives an amount and item list from the browser and records exactly what it was asked to charge. **That is not sufficient to prevent a modified client from requesting a lower amount.**

Before enabling checkout, move the authoritative canteen catalogue (item IDs, college/canteen IDs, prices, availability) to a server-controlled database and have the Worker calculate the total from item IDs and quantities. Also add real student authentication/token verification; do not trust a client-supplied phone, roll number, or student reference. Until those are implemented, keep `CHECKOUT_ENABLED = "false"`. The browser integration is wired to fail closed.

## 1. Create Cloudflare resources

Install Node.js LTS, then from this directory:

```bash
npm create cloudflare@latest -- campus-bites-payments
cd campus-bites-payments
# Copy this repository's cloudflare-payment/src/index.js,
# cloudflare-payment/migrations/0001_payments.sql and wrangler.toml
npx wrangler login
npx wrangler d1 create campus-bites-payments
```

Copy the returned database ID into `wrangler.toml`, then:

```bash
npx wrangler d1 migrations apply campus-bites-payments --remote
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler deploy
```

Use Razorpay **Test Mode** keys first. Configure the Razorpay webhook URL as:

`https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/webhooks/razorpay`

Subscribe to `payment.captured` and `payment.failed`. Copy the webhook secret into the Worker secret `RAZORPAY_WEBHOOK_SECRET`. Set `ALLOWED_ORIGIN` to the exact Campus Bites site origin.

## 2. Configure the frontend

In `index.html`, set `PAYMENT_API_BASE` to the deployed Worker origin (no trailing slash). The frontend now calls `POST /api/orders`, opens Razorpay Checkout with the server-created Razorpay order ID, then calls `POST /api/payments/verify`. It generates a receipt only after the server confirms the payment is captured.

The browser callback is not the source of truth: the Worker verifies the HMAC and independently fetches the payment from Razorpay. The webhook provides server-to-server recovery when a browser callback is interrupted.

## 3. Test before going live

1. Keep `CHECKOUT_ENABLED=false` until server-side catalogue and student authentication are implemented.
2. Test valid payment, cancellation, failed payment, altered amount, wrong order ID, invalid signature, duplicate webhook delivery and network interruption.
3. Verify that the database only marks captured payments as `paid`.
4. Confirm Razorpay Dashboard capture settings are automatic or payments are otherwise captured. An authorised-but-not-captured payment must not create a paid receipt.
5. Use live keys only after Razorpay account activation, webhook verification and test sign-off.

## API

- `POST /api/orders`: creates a Razorpay order and stores a pending record. Currently disabled unless `CHECKOUT_ENABLED=true`.
- `POST /api/payments/verify`: validates Checkout signature, retrieves payment status from Razorpay, and marks the D1 record paid only if captured and amount/order/currency match.
- `POST /api/webhooks/razorpay`: validates the raw-body webhook HMAC and updates matching payment records.
- `GET /health`: health check.

No endpoint returns secrets. Never commit Razorpay key secrets or webhook secrets to Git.
