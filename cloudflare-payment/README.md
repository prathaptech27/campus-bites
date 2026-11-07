# CampusBites multi-college payments

This branch adds a multi-college payment extension to the existing Cloudflare Worker, D1 and Razorpay checkout. The current student payment code is inline in index.html; this branch does not contain a separate payment-portal.js.

## Implemented
- Platform provisioning of colleges and their first owner/admin.
- College administrator OTP login plus role-based access.
- Central college settlement account or one settlement account per canteen.
- Razorpay Route composite linked-account onboarding.
- Bank account number and PAN are sent to Razorpay and are not stored in CampusBites. Only linked-account IDs, masked account suffix and verification metadata are stored.
- Server-side destination resolution and amount calculation.
- Central mode creates one Route transfer; canteen mode creates multiple transfers grouped by canteen in one Razorpay order.
- Payment signature and captured-payment verification.
- Webhook reconciliation for payment and transfer events.
- Direct-bank request records and a fail-closed adapter interface. A real direct-bank adapter requires that bank's approved API specification, credentials and webhook signing rules.

## Important fund-flow note
Razorpay Route is not a student-to-bank direct UPI transfer. The payment is accepted by the parent Razorpay merchant and the configured transfer is created for the linked college/canteen account after capture. Route must be approved and enabled for the parent merchant. Confirm the business model, legal fund flow, fees and settlement arrangements with Razorpay and a qualified compliance adviser before production.

## Deploy
From cloudflare-payment:

```bash
npx wrangler login
npx wrangler d1 migrations apply campus-bites-payment --remote
npx wrangler deploy
```

Migration 0002_multi_college_payments.sql is additive; it does not replace the existing colleges, menu_items, payment_orders or webhook tables.

## Worker secrets
Set these using Wrangler secrets (never put them in frontend code):
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- SESSION_SECRET
- OTP_SECRET
- RESEND_API_KEY
- CATALOG_ADMIN_TOKEN
- PLATFORM_ADMIN_TOKEN

Use long random values for session, OTP, catalogue-admin and platform-admin secrets. Keep these vars false during setup:
- CHECKOUT_ENABLED
- MULTI_TENANT_PAYMENTS_ENABLED
- ROUTE_ENABLED

Set ALLOWED_ORIGIN to the exact HTTPS frontend origin and MAIL_FROM to a sender domain verified with Resend.

## Provision a college
Only the trusted CampusBites platform operator may call this endpoint. It creates the college in the existing colleges table and grants the initial owner role.

```bash
curl -X POST https://YOUR-WORKER.workers.dev/api/platform/colleges \
  -H "Authorization: Bearer PLATFORM_ADMIN_TOKEN_VALUE" \
  -H "Content-Type: application/json" \
  -d '{"id":"college_kpr","name":"KPR College","email_domain":"OFFICIAL_COLLEGE_DOMAIN","owner_email":"admin@OFFICIAL_COLLEGE_DOMAIN"}'
```

Replace the example domain and email with verified institutional details. Add further administrators using POST /api/platform/college-admins with the platform token. A college email OTP alone does not grant admin access; the email must exist in cb_college_admins.

## College admin page
Open college-admin.html and replace the API_BASE placeholder with the deployed Worker URL. Host it on the same allowed frontend origin. College administrators sign in with their institutional email OTP and then:
1. Select central or individual-canteen settlement.
2. Submit legal institution details and the authorised bank account to Razorpay Route composite onboarding.
3. Refresh the linked-account status until the provider reports the settlement account verified and active.
4. Save the college's payment destination policy.

The college must be authorised to use the submitted account as its merchant settlement account. Raw PAN/account number values are not persisted by CampusBites.

## Razorpay Route
The onboarding endpoint uses POST /v2/accounts with a composite settlement account. Order creation uses POST /v1/orders with a transfers array. Razorpay creates the linked-account transfer after the payment is captured and the order is paid.

Configure the Razorpay webhook:
https://YOUR-WORKER.workers.dev/api/webhooks/razorpay

Subscribe to payment.captured, payment.failed, order.paid, transfer.processed, transfer.failed, transfer.reversed and refund.processed. The webhook secret must match RAZORPAY_WEBHOOK_SECRET.

## Enable test checkout
Only after Route approval, college linked-account verification, webhook setup and migration application, enable:
- CHECKOUT_ENABLED = true
- MULTI_TENANT_PAYMENTS_ENABLED = true
- ROUTE_ENABLED = true

Deploy the Worker and set PAYMENT_API_BASE in index.html to the Worker URL. Test with Razorpay Test Mode first.

## Settlement behavior
- CENTRAL: every canteen item in the basket is routed to the college's central linked account.
- CANTEEN: the Worker groups items by canteen and routes each canteen subtotal to that canteen's verified linked account.
- Missing, pending or suspended destinations block checkout.
- Prices and destination IDs supplied by the browser are ignored; the Worker uses D1 data.
- Cash orders remain separate from online payments.

## Direct bank integrations
The direct-bank request endpoint stores a pending bank-issued merchant reference. src/providers/direct-bank.js is a fail-closed adapter contract. Indian banks do not expose one universal merchant API. Implement a separate adapter using the chosen bank's official API specification, credentials, server-side status lookup, webhook signature scheme, refund API and settlement rules. Until that adapter is implemented and tested, direct-bank destinations cannot accept payments. Never treat a UPI intent redirect, static QR, screenshot or student-entered UTR as payment confirmation.

## Tests
- College A cannot read or modify College B data.
- Students cannot call college-admin APIs without admin membership.
- Platform endpoints reject invalid platform tokens.
- Central mode creates exactly one transfer.
- Individual mode creates correct per-canteen transfers, including mixed-canteen baskets.
- Missing destination blocks the order.
- Browser-supplied price, college or destination cannot override D1.
- Wrong signature, order ID, payment ID, amount or currency is rejected.
- Authorised but uncaptured payments never produce paid receipts.
- Duplicate webhook events do not duplicate payment state.
- Transfer failures and reversals are recorded separately.
- Cash collection remains staff-only.

## API endpoints
Platform:
- POST /api/platform/colleges
- POST /api/platform/college-admins

College admin:
- GET /api/college-admin/config
- PUT /api/college-admin/settings
- POST /api/college-admin/route/onboard
- POST /api/college-admin/route/refresh
- POST /api/college-admin/direct-bank/request

Student:
- POST /api/orders
- POST /api/payments/verify
- POST /api/webhooks/razorpay
