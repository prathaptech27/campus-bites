# Campus Bites — Razorpay + Cloudflare Worker + D1

## Security model

- The browser submits menu item IDs and quantities only. The Worker calculates the total from D1 prices.
- Checkout requires an 8-hour signed session issued only after a six-digit email OTP is verified.
- OTPs expire after five minutes, are stored as HMAC hashes, allow at most five guesses, and are rate-limited to three sends per email per 15 minutes.
- Email must match the domain configured for that college in D1.
- Razorpay orders are created server-side; Checkout signature is checked server-side; Razorpay payment status, amount, order and currency are independently checked before paid status is set.
- Signed, deduplicated Razorpay webhooks reconcile captures, failures and refunds.
- Razorpay secrets, OTP/session secrets and catalogue admin token are Worker secrets, never frontend values.

Email OTP proves mailbox ownership. It does not prove college enrollment independently; configure only domains controlled by the college and maintain the D1 catalogue/college records through a trusted administrator.

## 1. Cloudflare setup

Install Node.js LTS and Wrangler, authenticate with `npx wrangler login`, create D1:

```bash
npx wrangler d1 create campus-bites-payments
```

Copy the returned ID to `wrangler.toml`, then apply migrations:

```bash
npx wrangler d1 migrations apply campus-bites-payments --remote
```

Set secrets (never commit them):

```bash
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put OTP_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CATALOG_ADMIN_TOKEN
```

Use random 32+ byte values for SESSION_SECRET, OTP_SECRET and CATALOG_ADMIN_TOKEN. Configure MAIL_FROM with a sender domain verified in Resend. Configure ALLOWED_ORIGIN to the exact HTTPS Campus Bites origin.

## 2. Import authoritative menu and college domains

For the current legacy app, menu data is in browser local storage. Open Campus Bites while signed in as an administrator, open browser DevTools Console, and run this export expression. It copies a JSON payload to your clipboard:

```js
copy(JSON.stringify({
  colleges: (JSON.parse(localStorage.getItem("cb_colleges") || "[]")).map(c => ({
    id: c.id, name: c.name, email_domain: String(c.domain || "").toLowerCase()
  })),
  items: (JSON.parse(localStorage.getItem("cb_menu") || "[]")).map(m => ({
    id: String(m.id), name: m.name, price: Number(m.price),
    category: m.category || "Other", college_name: m.college,
    canteen_name: m.canteen, active: m.active !== false
  }))
}, null, 2));
```

Paste the clipboard contents into a local file named `catalog.json`. Review every college email domain carefully; remove colleges with no verified institutional email domain and do not use a personal email provider domain. Export a fresh file and re-import it whenever menu prices or availability change.

The import format is:

```json
{
  "colleges": [{"id":"col_vpiet","name":"VPIET","email_domain":"vpiet.ac.in"}],
  "items": [
    {"id":"item_001","name":"Idli","price":25,"category":"Tiffin","college_name":"VPIET","canteen_name":"Main","active":true}
  ]
}
```

Send it from a trusted administrator workstation, not from browser code:

```bash
curl -X POST https://YOUR-WORKER.workers.dev/api/catalog/import \
  -H "Authorization: Bearer $CATALOG_ADMIN_TOKEN" \
  -H "Content-Type: application/json" --data-binary @catalog.json
```

Use stable unique item IDs. Update the imported catalogue whenever an administrator changes menu prices. The admin token must never be placed in `index.html`.

## 3. Razorpay and email

Use Razorpay Test Mode first. Configure webhook URL:
`https://YOUR-WORKER.workers.dev/api/webhooks/razorpay`
Subscribe to `payment.captured`, `payment.failed`, and `payment.refunded`. The webhook secret must match RAZORPAY_WEBHOOK_SECRET.

## 4. Enable test checkout

Only after importing and validating all college domains and menu items, configuring Resend, deploying, and completing tests, set:
`CHECKOUT_ENABLED = "true"`
with `npx wrangler deploy`.

Set PAYMENT_API_BASE in index.html to the deployed Worker origin. Never use live Razorpay keys until Test Mode passes.

## Required tests

- Missing/expired session and email from an unapproved domain.
- OTP expiry, five wrong attempts, and rate limiting.
- Unknown menu item, item from another college, changed client price (prices are ignored), duplicate IDs, quantity >20.
- Wrong Razorpay signature, payment ID, amount, order ID or currency.
- Authorized but uncaptured payment must not create a paid receipt.
- Captured payment, duplicate webhook, browser closed before callback, failed payment and refund.
- Verify receipts only use backend-confirmed amounts and item descriptions.

## Endpoints

- GET /health
- GET /api/catalog?college=...
- POST /api/auth/email/start
- POST /api/auth/email/verify
- POST /api/catalog/import (admin token)
- POST /api/orders (verified session, item IDs/quantities only)
- POST /api/payments/verify (verified session + Razorpay signature)
- POST /api/webhooks/razorpay (Razorpay signature)
