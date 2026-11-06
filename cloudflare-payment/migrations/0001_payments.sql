CREATE TABLE IF NOT EXISTS payment_orders (
  app_order_id TEXT PRIMARY KEY,
  order_token TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  items_json TEXT NOT NULL,
  student_ref TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_token ON payment_orders(order_token);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  event_id TEXT PRIMARY KEY,
  received_at INTEGER NOT NULL
);
