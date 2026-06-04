-- Founder messages (direct messages between users)
-- Safe to run repeatedly

CREATE TABLE IF NOT EXISTS founder_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_messages_recipient_unread ON founder_messages(recipient_id, read_at, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_founder_messages_sender ON founder_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_messages_conversation ON founder_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_messages_recipient_all ON founder_messages(recipient_id, created_at DESC);

-- Admin view: count of unread messages per user
CREATE INDEX IF NOT EXISTS idx_founder_messages_unread_count ON founder_messages(recipient_id) WHERE read_at IS NULL;