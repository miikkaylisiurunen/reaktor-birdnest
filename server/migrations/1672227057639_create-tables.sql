-- Up Migration
CREATE TABLE drones (
  drone_id            BIGSERIAL PRIMARY KEY,
  drone_serial_number TEXT NOT NULL UNIQUE,
  drone_last_seen_at  TIMESTAMPTZ NOT NULL,
  drone_distance      DECIMAL NOT NULL
);

CREATE TABLE pilots (
  drone_id            BIGINT UNIQUE NOT NULL REFERENCES drones (drone_id) ON DELETE CASCADE,

  pilot_id            BIGSERIAL PRIMARY KEY,
  pilot_first_name    TEXT NOT NULL,
  pilot_last_name     TEXT NOT NULL,
  pilot_phone_number  TEXT NOT NULL,
  pilot_email_address TEXT NOT NULL
);

-- Down migration
