CREATE TABLE IF NOT EXISTS roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    position INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
)