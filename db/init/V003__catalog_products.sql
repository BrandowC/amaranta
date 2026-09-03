CREATE TABLE catalog.products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(50)  NOT NULL UNIQUE,
  name            VARCHAR(120) NOT NULL,
  description     VARCHAR(500) NOT NULL,
  category        VARCHAR(20)  NOT NULL
                  CHECK (category IN ('FOOD','ACCESSORIES','HYGIENE','MEDICATION','TOYS')),
  price_amount    INTEGER     NOT NULL CHECK (price_amount > 0),
  stock_quantity  INTEGER     NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url       VARCHAR(500) NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_is_active ON catalog.products (is_active);
