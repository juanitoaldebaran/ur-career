CREATE TABLE IF NOT EXISTS practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_slug TEXT NOT NULL REFERENCES roadmaps(slug) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('coding', 'system_design')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    prompt TEXT NOT NULL,
    approach TEXT NOT NULL,
    evaluating TEXT NOT NULL,
    reference_answer TEXT NOT NULL,
    rubric JSONB NOT NULL,
    position INT NOT NULL DEFAULT 0,
    UNIQUE (role_slug, category, position)
);
CREATE INDEX IF NOT EXISTS idx_practice_questions_role ON practice_questions(role_slug, category, position);
