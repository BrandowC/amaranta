CREATE TABLE identity.users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(10),
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER'
                  CHECK (role IN ('CUSTOMER','RECEPTIONIST','VETERINARIAN','GROOMER','ADMIN')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON identity.users (email);
