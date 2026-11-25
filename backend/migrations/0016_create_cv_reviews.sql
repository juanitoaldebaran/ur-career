CREATE TABLE IF NOT EXISTS cv_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_sha256 TEXT NOT NULL,
    target_role TEXT NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    summary TEXT NOT NULL,
    criteria JSONB NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, file_sha256, target_role)
);

CREATE INDEX IF NOT EXISTS idx_cv_reviews_user_created ON cv_reviews (user_id, created_at DESC);