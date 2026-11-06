/**
 * Campus Bites Razorpay payment API.
 * Cloudflare Worker + D1. No secret is ever sent to the browser.
 *
 * Required Worker secrets:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 * Required vars:
 *   ALLOWED_ORIGIN (exact HTTPS app origin)
 *   CHECKOUT_ENABLED ("true" only after server-side catalogue validation is enabled)
 * Binding:
 *   DB (D1 database)
 */
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (origin && allowed && origin === allowed) {
    return {
      "access-control-allow-origin": allowed,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, X-Razorpay-Signature",
      "access-control-max-age": "86400",
      "vary": "Origin",
    };
  }
  return {};
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function razorpayRequest(env, path, options = {}) {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.description || `Razorpay API error (${response.status})`);
  }
  return body;
}

async function createOrder(request, env) {
  if (env.CHECKOUT_ENABLED !== "true") {
    return json({ error: "Checkout is disabled until server-side menu price validation is configured." }, 503);
  }
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.amountPaise) || body.amountPaise < 100 || body.amountPaise > 10000000) {
    return json({ error: "Invalid order amount." }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return json({ error: "Invalid order items." }, 400);
  }
  if (typeof body.orderToken !== "string" || !/^\d{1,8}$/.test(body.orderToken)) {
    return json({ error: "Invalid Campus Bites order token." }, 400);
  }

  // NOTE: amount and item prices are currently supplied by the legacy browser app.
  // Do not enable checkout until these values are checked against a server-owned catalogue.
  const appOrderId = crypto.randomUUID();
  const amountPaise = body.amountPaise;
  const created = await razorpayRequest(env, "/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: `cb_${appOrderId.replace(/-/g, "").slice(0, 20)}`,
      notes: { campus_bites_order_id: appOrderId, campus_bites_token: body.orderToken },
    }),
  });

  await env.DB.prepare(
    `INSERT INTO payment_orders
      (app_order_id, order_token, razorpay_order_id, amount_paise, currency, status, items_json, student_ref, created_at)
     VALUES (?, ?, ?, ?, 'INR', 'created', ?, ?, ?)`,
  ).bind(
    appOrderId,
    body.orderToken,
    created.id,
    amountPaise,
    JSON.stringify(body.items),
    String(body.studentRef || "").slice(0, 120),
    Date.now(),
  ).run();

  return json({
    appOrderId,
    razorpayOrderId: created.id,
    amount: created.amount,
    currency: created.currency,
    keyId: env.RAZORPAY_KEY_ID,
  }, 201);
}

async function verifyCheckout(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return json({ error: "Missing payment verification fields." }, 400);
  }

  const record = await env.DB.prepare(
    "SELECT * FROM payment_orders WHERE razorpay_order_id = ?",
  ).bind(body.razorpay_order_id).first();
  if (!record) return json({ error: "Order not found." }, 404);

  const expected = await hmacHex(
    env.RAZORPAY_KEY_SECRET,
    `${record.razorpay_order_id}|${body.razorpay_payment_id}`,
  );
  if (!safeEqual(expected, body.razorpay_signature)) {
    return json({ error: "Payment signature verification failed." }, 400);
  }

  const payment = await razorpayRequest(env, `/payments/${encodeURIComponent(body.razorpay_payment_id)}`);
  if (
    payment.order_id !== record.razorpay_order_id ||
    payment.amount !== record.amount_paise ||
    payment.currency !== "INR"
  ) {
    return json({ error: "Payment does not match the Campus Bites order." }, 409);
  }
  if (payment.status !== "captured") {
    return json({ error: "Payment is not captured yet. Please wait or retry verification.", status: payment.status }, 409);
  }

  await env.DB.prepare(
    `UPDATE payment_orders
       SET status = 'paid', razorpay_payment_id = ?, paid_at = COALESCE(paid_at, ?)
     WHERE app_order_id = ? AND status != 'refunded'`,
  ).bind(payment.id, Date.now(), record.app_order_id).run();

  return json({
    verified: true,
    appOrderId: record.app_order_id,
    paymentId: payment.id,
    status: "paid",
  });
}

async function razorpayWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Razorpay-Signature") || "";
  const expected = await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
  if (!safeEqual(expected, signature)) return json({ error: "Invalid webhook signature." }, 400);

  const eventId = request.headers.get("x-razorpay-event-id") || "";
  if (!eventId) return json({ error: "Missing webhook event id." }, 400);

  const event = JSON.parse(rawBody);
  const eventName = event.event;
  const payment = event.payload?.payment?.entity;
  if (eventName === "payment.captured" && payment) {
    const row = await env.DB.prepare(
      "SELECT * FROM payment_orders WHERE razorpay_order_id = ?",
    ).bind(payment.order_id).first();

    if (row && payment.amount === row.amount_paise && payment.currency === "INR" && payment.status === "captured") {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO razorpay_webhook_events (event_id, received_at) VALUES (?, ?)",
      ).bind(eventId, Date.now()).run();
      await env.DB.prepare(
        `UPDATE payment_orders SET status = 'paid', razorpay_payment_id = ?, paid_at = COALESCE(paid_at, ?)
         WHERE app_order_id = ? AND status != 'refunded'`,
      ).bind(payment.id, Date.now(), row.app_order_id).run();
    }
  } else if (eventName === "payment.failed" && payment?.order_id) {
    await env.DB.prepare(
      "UPDATE payment_orders SET status = 'failed' WHERE razorpay_order_id = ? AND status = 'created'",
    ).bind(payment.order_id).run();
  }

  return json({ received: true });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "campus-bites-payments" }, 200, cors);
      }
      if (request.method === "POST" && url.pathname === "/api/orders") {
        const response = await createOrder(request, env);
        return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...cors } });
      }
      if (request.method === "POST" && url.pathname === "/api/payments/verify") {
        const response = await verifyCheckout(request, env);
        return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...cors } });
      }
      if (request.method === "POST" && url.pathname === "/api/webhooks/razorpay") {
        return await razorpayWebhook(request, env);
      }
      return json({ error: "Not found." }, 404, cors);
    } catch (error) {
      console.error("Campus Bites payment API error:", error);
      return json({ error: "Payment service temporarily unavailable." }, 500, cors);
    }
  },
};
