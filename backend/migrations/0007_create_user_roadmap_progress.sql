CREATE TABLE IF NOT EXISTS user_roadmap_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    status_roadmap TEXT NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, node_id)
);