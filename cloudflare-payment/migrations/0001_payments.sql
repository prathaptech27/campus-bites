CREATE TABLE IF NOT EXISTS payment_orders (
  app_order_id TEXT PRIMARY KEY,
  order_token TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created','paid','failed','refunded')),
  items_json TEXT NOT NULL,
  student_ref TEXT NOT NULL,
  college_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_token ON payment_orders(order_token);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_student ON payment_orders(student_ref,created_at);
CREATE TABLE IF NOT EXISTS razorpay_webhook_events(event_id TEXT PRIMARY KEY,received_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS colleges(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,email_domain TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS menu_items(id TEXT PRIMARY KEY,name TEXT NOT NULL,price_paise INTEGER NOT NULL CHECK(price_paise>0),category TEXT NOT NULL,college_name TEXT NOT NULL,canteen_name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_menu_college_active ON menu_items(college_name,active);
CREATE TABLE IF NOT EXISTS email_otps(email TEXT NOT NULL,college_id TEXT NOT NULL,otp_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,PRIMARY KEY(email,college_id));
CREATE INDEX IF NOT EXISTS idx_email_otps_created ON email_otps(email,created_at);
