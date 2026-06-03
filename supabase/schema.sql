-- Likelyr schema
-- Use IF NOT EXISTS for safe re-runs

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  image TEXT,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  banned BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'launch', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  launch_pass_purchased_at TIMESTAMPTZ,
  profile_headline TEXT,
  profile_bio TEXT,
  profile_website_url TEXT,
  profile_demo_url TEXT,
  profile_linkedin_url TEXT,
  profile_x_url TEXT,
  profile_cta_label TEXT,
  profile_cta_url TEXT,
  profile_show_contact BOOLEAN DEFAULT TRUE,
  profile_weekly_digest_opt_in BOOLEAN DEFAULT TRUE,
  profile_featured_category TEXT,
  email_verified_at TIMESTAMPTZ,
  prediction_elo INTEGER DEFAULT 1000,
  prediction_wins INTEGER DEFAULT 0,
  prediction_losses INTEGER DEFAULT 0,
  prediction_streak INTEGER DEFAULT 0,
  best_prediction_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add banned column if it doesn't exist (for existing deployments)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS launch_pass_purchased_at TIMESTAMPTZ;
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
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_elo INTEGER DEFAULT 1000;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_wins INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_losses INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_streak INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS best_prediction_streak INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  token TEXT UNIQUE NOT NULL,
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_auth_tokens_user_type_idx ON user_auth_tokens(user_id, type);
CREATE INDEX IF NOT EXISTS user_auth_tokens_expires_at_idx ON user_auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  pitch TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  problem TEXT NOT NULL,
  revenue_model TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Launched', 'Revenue')),
  elo_score INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_a_id UUID REFERENCES ideas(id) NOT NULL,
  idea_b_id UUID REFERENCES ideas(id) NOT NULL,
  idea_a_votes INTEGER DEFAULT 0,
  idea_b_votes INTEGER DEFAULT 0,
  winner_id UUID REFERENCES ideas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES ideas(id) NOT NULL,
  prediction_target_id UUID REFERENCES ideas(id),
  prediction_correct BOOLEAN,
  prediction_ranked BOOLEAN DEFAULT TRUE,
  voter_elo_before INTEGER,
  voter_elo_after INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (rate_key, window_start)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id TEXT,
  path TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Add flag_count column if it doesn't exist (for existing deployments)
DO $$ BEGIN
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_elo ON ideas(elo_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_votes_battle_id ON votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_prediction_correct ON votes(prediction_correct);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot);
CREATE INDEX IF NOT EXISTS idx_users_prediction_elo ON users(prediction_elo DESC);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_featured_category ON users(profile_featured_category);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_created_at ON api_rate_limits(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created_at ON analytics_events(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_gin ON analytics_events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_founder_updates_user_created_at ON founder_updates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_leads_founder_created_at ON founder_leads(founder_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_score_history_idea_created_at ON idea_score_history(idea_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS votes_battle_user_unique ON votes(battle_id, user_id);
