-- Admin email suite: preferences, automations, campaigns, and delivery audit log.
-- Safe to run repeatedly.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_marketing_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_weekly_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_product_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS email_automations (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  segment_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  last_run_at TIMESTAMPTZ,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  segment_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  automation_key TEXT REFERENCES email_automations(key) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_sent_at ON email_deliveries(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_automation_sent_at ON email_deliveries(automation_key, sent_at DESC);

INSERT INTO email_automations (key, name, segment_key, subject, body, cta_label, cta_url)
VALUES
  (
    'weekly_arena_digest',
    'Weekly arena digest',
    'all_users',
    'This week''s Likelyr momentum',
    'Here are the ideas moving fastest this week. Vote on a few battles and see which founders are gaining signal.',
    'Open the arena',
    '/battle'
  ),
  (
    'weekly_no_idea_nudge',
    'No-project nudge',
    'no_idea',
    'Put your first idea into the arena',
    'You signed up, but your first idea is not live yet. Add one project and start collecting votes from real comparisons.',
    'Submit an idea',
    '/submit'
  ),
  (
    'weekly_inactive_battle_nudge',
    'Battle reactivation',
    'inactive_battle_7d',
    'New startup battles are waiting',
    'A fresh batch of ideas needs votes. Jump into a few matchups and keep your predictor score moving.',
    'Vote on battles',
    '/battle'
  ),
  (
    'weekly_founder_growth',
    'Founder growth brief',
    'active_founders',
    'Your weekly founder signal check',
    'Check your ideas, read the newest feedback, and share a challenge link if you need more signal this week.',
    'Open dashboard',
    '/dashboard'
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  segment_key = EXCLUDED.segment_key;
