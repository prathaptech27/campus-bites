-- CampusBites multi-college payment extension.
-- Does not replace legacy colleges/menu_items/payment_orders tables.
CREATE TABLE IF NOT EXISTS cb_college_admins (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN','FINANCE')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS cb_college_admin_unique
  ON cb_college_admins(college_id, email);

CREATE TABLE IF NOT EXISTS cb_payment_settings (
  college_id TEXT PRIMARY KEY,
  destination_mode TEXT NOT NULL DEFAULT 'CENTRAL'
    CHECK(destination_mode IN ('CENTRAL','CANTEEN')),
  integration_mode TEXT NOT NULL DEFAULT 'RAZORPAY_ROUTE'
    CHECK(integration_mode IN ('RAZORPAY_ROUTE','DIRECT_BANK','HYBRID')),
  updated_by TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cb_merchant_connections (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('RAZORPAY_ROUTE','DIRECT_BANK')),
  external_merchant_id TEXT,
  provider_reference TEXT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','ACTIVE','REJECTED','SUSPENDED')),
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  masked_account TEXT,
  metadata_json TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cb_merchant_college_idx
  ON cb_merchant_connections(college_id, status);

CREATE TABLE IF NOT EXISTS cb_payment_destinations (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL,
  destination_type TEXT NOT NULL CHECK(destination_type IN ('CENTRAL','CANTEEN')),
  canteen_name TEXT,
  merchant_connection_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','ACTIVE','DISABLED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS cb_unique_central_destination
  ON cb_payment_destinations(college_id)
  WHERE destination_type='CENTRAL';
CREATE UNIQUE INDEX IF NOT EXISTS cb_unique_canteen_destination
  ON cb_payment_destinations(college_id, canteen_name)
  WHERE destination_type='CANTEEN';
CREATE INDEX IF NOT EXISTS cb_destinations_lookup_idx
  ON cb_payment_destinations(college_id, destination_type, status);

CREATE TABLE IF NOT EXISTS cb_multi_payment_orders (
  app_order_id TEXT PRIMARY KEY,
  order_token TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  college_id TEXT NOT NULL,
  college_name TEXT NOT NULL,
  canteen_name TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  merchant_connection_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created'
    CHECK(status IN ('created','paid','failed','refunded')),
  transfer_status TEXT NOT NULL DEFAULT 'created',
  transfer_ids_json TEXT,
  items_json TEXT NOT NULL,
  student_ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS cb_multi_orders_student_idx
  ON cb_multi_payment_orders(student_ref, created_at);
CREATE INDEX IF NOT EXISTS cb_multi_orders_college_idx
  ON cb_multi_payment_orders(college_id, created_at);

CREATE TABLE IF NOT EXISTS cb_payment_audit (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  created_at INTEGER NOT NULL
);
