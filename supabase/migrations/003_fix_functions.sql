-- Quick fix for existing function conflicts
-- Run this if you get errors about existing functions when applying migration 003

-- ============================================================================
-- Drop existing functions with different signatures
-- ============================================================================

DROP FUNCTION IF EXISTS search_digest_items(vector, double precision, integer);
DROP FUNCTION IF EXISTS search_digest_items(vector, float, int);
DROP FUNCTION IF EXISTS get_personalized_feed(uuid, integer);
DROP FUNCTION IF EXISTS get_personalized_feed(uuid, int);
DROP FUNCTION IF EXISTS refresh_user_preference_vector(uuid);
DROP FUNCTION IF EXISTS calculate_cosine_similarity(vector, vector);

-- Now run migration 003 again, it should work!
