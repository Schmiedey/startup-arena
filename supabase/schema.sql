-- Likelyr schema
-- Use IF NOT EXISTS for safe re-runs

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  image TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  banned BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'launch', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  launch_pass_purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add banned column if it doesn't exist (for existing deployments)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS launch_pass_purchased_at TIMESTAMPTZ;
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
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_created_at ON api_rate_limits(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created_at ON analytics_events(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS votes_battle_user_unique ON votes(battle_id, user_id);
