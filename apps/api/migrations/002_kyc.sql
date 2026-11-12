CREATE TABLE kyc_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'SUBMITTED'
                   CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED')),
  documents        JSONB NOT NULL DEFAULT '[]',
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewer_id      UUID REFERENCES users(id),
  rejection_reason TEXT
);