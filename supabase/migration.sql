-- Add unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX IF NOT EXISTS votes_battle_user_unique ON votes (battle_id, user_id);