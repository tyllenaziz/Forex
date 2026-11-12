CREATE TABLE instruments (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol   TEXT UNIQUE NOT NULL,
  kind     TEXT NOT NULL,
  enabled  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  account_mode  TEXT NOT NULL CHECK (account_mode IN ('DEMO','REAL')),
  symbol        TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  type          TEXT NOT NULL CHECK (type IN ('MARKET','LIMIT','STOP')),
  volume        NUMERIC(18,4) NOT NULL,
  price         NUMERIC(18,6),
  stop_loss     NUMERIC(18,6),
  take_profit   NUMERIC(18,6),
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','FILLED','REJECTED','CANCELLED')),
  external_ref  TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);