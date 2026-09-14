CREATE TABLE IF NOT EXISTS roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);