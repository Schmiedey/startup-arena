-- Idea approval system + image_url + site_settings
-- Safe to run repeatedly

-- Add status column to ideas (pending, approved, rejected)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Backfill existing ideas as approved
UPDATE ideas SET status = 'approved' WHERE status IS NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- Site settings table (single-row config)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  auto_accept_ideas BOOLEAN DEFAULT TRUE
);

-- Insert default settings row if not exists
INSERT INTO site_settings (id, auto_accept_ideas)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;