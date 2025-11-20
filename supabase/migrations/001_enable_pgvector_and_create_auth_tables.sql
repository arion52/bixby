-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- USER AUTHENTICATION AND PROFILE TABLES
-- ============================================================================

-- User profiles table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  preferred_categories TEXT[] DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites junction table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  digest_item_id UUID NOT NULL REFERENCES digest_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, digest_item_id)
);

-- User read status junction table
CREATE TABLE IF NOT EXISTS user_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  digest_item_id UUID NOT NULL REFERENCES digest_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, digest_item_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item ON user_favorites(digest_item_id);
CREATE INDEX IF NOT EXISTS idx_user_read_status_user ON user_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_read_status_item ON user_read_status(digest_item_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_read_status ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- User preferences: users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

-- User favorites: users can only access their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

-- User read status: users can only access their own read status
CREATE POLICY "Users can view own read status" ON user_read_status
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own read status" ON user_read_status
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGER TO AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (auth_user_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES ((SELECT id FROM user_profiles WHERE auth_user_id = NEW.id));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_favorites TO authenticated;
GRANT SELECT, INSERT ON user_read_status TO authenticated;
