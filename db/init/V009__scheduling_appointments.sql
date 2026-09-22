CREATE TABLE scheduling.appointments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id              UUID        NOT NULL,
  owner_id            UUID        NOT NULL,
  professional_id     UUID        NOT NULL,
  service_type        VARCHAR(20) NOT NULL
                       CHECK (service_type IN ('MEDICAL_CONSULT', 'VACCINATION', 'GROOMING', 'SURGERY', 'EMERGENCY')),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER     NOT NULL CHECK (duration_minutes BETWEEN 15 AND 120),
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  created_by          UUID        NOT NULL,
  notes               VARCHAR(300),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_owner_id ON scheduling.appointments (owner_id);
CREATE INDEX idx_appointments_professional_id ON scheduling.appointments (professional_id, scheduled_at);
