-- Add vector embeddings and reading pattern tracking

-- ============================================================================
-- ADD EMBEDDING COLUMN TO DIGEST_ITEMS
-- ============================================================================

-- Add vector column for storing article embeddings (1536 dimensions for text-embedding-3-small)
ALTER TABLE digest_items
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add other missing columns referenced in code
ALTER TABLE digest_items
ADD COLUMN IF NOT EXISTS tldr TEXT,
ADD COLUMN IF NOT EXISTS sentiment TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;

-- Remove is_favorited column (now handled by user_favorites junction table)
ALTER TABLE digest_items
DROP COLUMN IF EXISTS is_favorited;

-- Add is_read column (will be deprecated in favor of user_read_status)
ALTER TABLE digest_items
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- ============================================================================
-- USER READING PATTERNS TABLE
-- ============================================================================

-- Track all user interactions with articles for building preference vectors
CREATE TABLE IF NOT EXISTS user_reading_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  digest_item_id UUID NOT NULL REFERENCES digest_items(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('click', 'read', 'favorite', 'skip')),
  dwell_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for vector similarity searches (will be created in next migration with HNSW)
-- For now, create basic index
CREATE INDEX IF NOT EXISTS idx_digest_items_embedding
ON digest_items USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Indexes for reading patterns
CREATE INDEX IF NOT EXISTS idx_user_reading_patterns_user
ON user_reading_patterns(user_id);

CREATE INDEX IF NOT EXISTS idx_user_reading_patterns_item
ON user_reading_patterns(digest_item_id);

CREATE INDEX IF NOT EXISTS idx_user_reading_patterns_type
ON user_reading_patterns(interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_reading_patterns_user_type
ON user_reading_patterns(user_id, interaction_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on reading patterns
ALTER TABLE user_reading_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own reading patterns
CREATE POLICY "Users can view own reading patterns" ON user_reading_patterns
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

-- Users can insert their own reading patterns
CREATE POLICY "Users can insert own reading patterns" ON user_reading_patterns
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

-- Digest items are public (anyone can read)
ALTER TABLE digest_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Digest items are public" ON digest_items
  FOR SELECT USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON digest_items TO authenticated, anon;
GRANT SELECT, INSERT ON user_reading_patterns TO authenticated;

-- ============================================================================
-- HELPER FUNCTION TO UPDATE READING TIME
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_reading_time(summary_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  reading_time INTEGER;
BEGIN
  -- Count words (split by spaces)
  word_count := array_length(string_to_array(summary_text, ' '), 1);

  -- Calculate reading time (200 words per minute, minimum 1 minute)
  reading_time := GREATEST(CEIL(word_count::float / 200), 1);

  RETURN reading_time;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing rows with reading time if not set
UPDATE digest_items
SET reading_time_minutes = calculate_reading_time(summary)
WHERE reading_time_minutes IS NULL AND summary IS NOT NULL;
