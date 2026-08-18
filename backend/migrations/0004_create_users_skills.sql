CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    proficiency TEXT NOT NULL
);
