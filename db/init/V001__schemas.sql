-- One schema per bounded context, inside a single PostgreSQL instance for the MVP.
-- Each schema is only ever written to by its own NestJS module — this is the seam
-- that becomes "database per service" when a module is extracted (06-data/models.md).
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS sales;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
