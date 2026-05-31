-- Launch hardening: first-party analytics and database-backed rate limits.

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

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_created_at ON api_rate_limits(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created_at ON analytics_events(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at DESC);
