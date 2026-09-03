CREATE TABLE sales.orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID        NOT NULL,
  channel         VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (channel IN ('ONLINE','IN_STORE')),
  created_by      UUID        NOT NULL,
  total_amount    INTEGER     NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','PAID','CANCELLED','FULFILLED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sales.order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id          UUID        NOT NULL,
  product_name        VARCHAR(120) NOT NULL,
  unit_price_amount   INTEGER     NOT NULL,
  quantity            INTEGER     NOT NULL CHECK (quantity > 0 AND quantity <= 50),
  subtotal_amount     INTEGER     NOT NULL
);

CREATE INDEX idx_orders_customer_id ON sales.orders (customer_id);
CREATE INDEX idx_order_items_order_id ON sales.order_items (order_id);
