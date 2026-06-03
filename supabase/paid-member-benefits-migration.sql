-- Paid member benefits: richer founder profiles, leads, updates, and idea score history.
-- Safe to run repeatedly.

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_headline TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_demo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_x_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_cta_label TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_cta_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_show_contact BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_weekly_digest_opt_in BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_featured_category TEXT;

CREATE TABLE IF NOT EXISTS founder_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  message TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idea_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_profile_featured_category ON users(profile_featured_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_gin ON analytics_events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_founder_updates_user_created_at ON founder_updates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_leads_founder_created_at ON founder_leads(founder_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_score_history_idea_created_at ON idea_score_history(idea_id, created_at DESC);
