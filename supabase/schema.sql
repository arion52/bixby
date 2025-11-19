-- Main table for digest items
CREATE TABLE IF NOT EXISTS digest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category TEXT NOT NULL, -- 'f1', 'dev_tools', 'ml_news', 'productivity', 'misc'
  title TEXT NOT NULL,
  summary TEXT NOT NULL, -- AI-generated 2-3 sentence summary
  source_url TEXT NOT NULL,
  source_name TEXT, -- e.g., "The-Race", "Hacker News"
  is_favorited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_digest_items_date ON digest_items (date);
CREATE INDEX IF NOT EXISTS idx_digest_items_category ON digest_items (category);
CREATE INDEX IF NOT EXISTS idx_digest_items_favorited ON digest_items (is_favorited);

-- Optional: Track fetch metadata
CREATE TABLE IF NOT EXISTS digest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL UNIQUE,
  status TEXT, -- 'success', 'partial', 'failed'
  items_fetched INTEGER,
  items_stored INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
