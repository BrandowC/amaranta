CREATE TABLE clinical.pets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL,
  name            VARCHAR(50) NOT NULL,
  species         VARCHAR(10) NOT NULL CHECK (species IN ('DOG', 'CAT', 'OTHER')),
  breed           VARCHAR(60),
  birth_date      DATE,
  weight_kg       NUMERIC(5,2) CHECK (weight_kg IS NULL OR weight_kg > 0),
  photo_url       VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_owner_id ON clinical.pets (owner_id);

CREATE TABLE clinical.medical_records (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            UUID        NOT NULL REFERENCES clinical.pets(id) ON DELETE CASCADE,
  appointment_id    UUID        NOT NULL,
  veterinarian_id   UUID        NOT NULL,
  diagnosis         VARCHAR(1000) NOT NULL,
  treatment         VARCHAR(1000),
  notes             VARCHAR(1000),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_records_pet_id ON clinical.medical_records (pet_id);
CREATE INDEX idx_medical_records_appointment_id ON clinical.medical_records (appointment_id);
