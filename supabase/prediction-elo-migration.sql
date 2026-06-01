-- Personal prediction Elo for voters

ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_elo INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_losses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_prediction_streak INTEGER DEFAULT 0;

ALTER TABLE votes ADD COLUMN IF NOT EXISTS prediction_target_id UUID REFERENCES ideas(id);
ALTER TABLE votes ADD COLUMN IF NOT EXISTS prediction_correct BOOLEAN;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS prediction_ranked BOOLEAN DEFAULT TRUE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_elo_before INTEGER;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_elo_after INTEGER;

CREATE INDEX IF NOT EXISTS idx_users_prediction_elo ON users(prediction_elo DESC);
CREATE INDEX IF NOT EXISTS idx_votes_prediction_correct ON votes(prediction_correct);
