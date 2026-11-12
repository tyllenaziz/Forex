-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ── Users ──────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  email         CITEXT UNIQUE NOT NULL,
  phone         TEXT NOT NULL,
  country       CHAR(2) NOT NULL,
  password_hash TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'UNVERIFIED'
                CHECK (status IN ('UNVERIFIED','ACTIVE','SUSPENDED','CLOSED')),
  kyc_status    TEXT NOT NULL DEFAULT 'UNVERIFIED'
                CHECK (kyc_status IN ('UNVERIFIED','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED')),
  role          TEXT NOT NULL DEFAULT 'USER'
                CHECK (role IN ('USER','SUPER_ADMIN','COMPLIANCE','FINANCE','TRADING_OPS','SUPPORT','AUDITOR')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Ledger ─────────────────────────────────────
CREATE TABLE ledger_accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  user_id    UUID REFERENCES users(id),
  currency   CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_ref         TEXT UNIQUE NOT NULL,
  txn_type        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'POSTED'
                  CHECK (status IN ('PENDING','POSTED','REVERSED','FAILED')),
  source          TEXT,
  destination     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_lines (
  id           BIGSERIAL PRIMARY KEY,
  entry_id     UUID NOT NULL REFERENCES journal_entries(id),
  account_id   UUID NOT NULL REFERENCES ledger_accounts(id),
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency     CHAR(3) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Immutability triggers ──────────────────────
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only', TG_TABLE_NAME;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_lines_immutable
  BEFORE UPDATE OR DELETE ON ledger_lines
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TRIGGER journal_entries_immutable
  BEFORE DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- ── Balances view (derived, never stored) ──────
CREATE VIEW account_balances AS
SELECT
  a.id AS account_id,
  a.code,
  a.currency,
  COALESCE(SUM(CASE WHEN l.direction='C' THEN l.amount_minor
                    ELSE -l.amount_minor END), 0)::BIGINT AS balance_minor
FROM ledger_accounts a
LEFT JOIN ledger_lines l ON l.account_id = a.id
LEFT JOIN journal_entries j ON j.id = l.entry_id AND j.status = 'POSTED'
GROUP BY a.id, a.code, a.currency;

-- ── Audit log ──────────────────────────────────
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  before_hash TEXT,
  after_hash  TEXT,
  ip          INET,
  request_id  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();