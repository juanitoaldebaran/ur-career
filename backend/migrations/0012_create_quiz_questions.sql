CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    position INT NOT NULL,
    prompt TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index BETWEEN 0 and 3),
    explanation TEXT NOT NULL 
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, position);

