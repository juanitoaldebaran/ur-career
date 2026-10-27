CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_slug TEXT NOT NULL REFERENCES roadmaps(slug) ON DELETE CASCADE,
    score INT,
    answers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id, role_slug, created_at DESC);