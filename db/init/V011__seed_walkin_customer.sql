-- A fixed, well-known customer row that anonymous in-store sales are attributed to when the
-- receptionist doesn't identify a specific registered customer (see sales/domain/value-objects/
-- walk-in-customer.ts for the matching constant). Not a real login — password_hash is a
-- placeholder that can never be produced by the normal register/login flow.
INSERT INTO identity.users (id, full_name, email, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Cliente de mostrador',
  'walk-in@amaranta.local',
  'walk-in-no-login',
  'CUSTOMER'
)
ON CONFLICT (id) DO NOTHING;
