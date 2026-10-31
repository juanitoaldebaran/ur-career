CREATE TABLE IF NOT EXISTS practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    feedback TEXT NOT NULL,
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_question ON practice_attempts(user_id, question_id);
