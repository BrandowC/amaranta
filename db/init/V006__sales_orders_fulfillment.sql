-- Adds checkout-wizard fields (delivery vs pickup, payment intent, contact info)
-- to sales.orders. Additive + NOT NULL with DEFAULT, so it is safe to run against
-- an instance that already has orders (see 06-data/models.md migration rules).
ALTER TABLE sales.orders
  ADD COLUMN fulfillment_method VARCHAR(20) NOT NULL DEFAULT 'PICKUP'
             CHECK (fulfillment_method IN ('PICKUP', 'DELIVERY')),
  ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH'
             CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER')),
  ADD COLUMN contact_name VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN contact_phone VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN delivery_address VARCHAR(255);
