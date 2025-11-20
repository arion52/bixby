# Bixby Database Migrations

This directory contains SQL migrations for the Bixby AI-powered news digest application.

## Migration Order

Migrations must be applied in the following order:

1. **001_enable_pgvector_and_create_auth_tables.sql** - Auth infrastructure
2. **002_add_embeddings_and_reading_patterns.sql** - Vector embeddings
3. **003_implement_preference_vectors.sql** - AI personalization

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of each migration file **in order**
5. Click "Run" to execute
6. Verify no errors in the output

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/bixby

# Apply all migrations
supabase db push

# Or apply individually
supabase db execute -f supabase/migrations/001_enable_pgvector_and_create_auth_tables.sql
supabase db execute -f supabase/migrations/002_add_embeddings_and_reading_patterns.sql
supabase db execute -f supabase/migrations/003_implement_preference_vectors.sql
```

### Option 3: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Apply migrations in order
\i supabase/migrations/001_enable_pgvector_and_create_auth_tables.sql
\i supabase/migrations/002_add_embeddings_and_reading_patterns.sql
\i supabase/migrations/003_implement_preference_vectors.sql
```

## What Each Migration Does

### 001: Auth Infrastructure

Creates the foundation for multi-user authentication:

- **Tables**: `user_profiles`, `user_preferences`, `user_favorites`, `user_read_status`
- **RLS Policies**: Row-level security for user data isolation
- **Trigger**: Auto-create user profile on signup
- **Extensions**: Enables pgvector extension

**Key Features:**
- Links Supabase Auth to user profiles
- Stores user preferences (categories, timezone, notifications)
- Tracks favorites and read status per-user
- Secure: Users can only access their own data

### 002: Vector Embeddings

Adds vector storage and interaction tracking:

- **Columns**: `embedding vector(1536)`, `tldr`, `sentiment`, `image_url`, `reading_time_minutes`
- **Table**: `user_reading_patterns` for tracking clicks, reads, favorites, skips
- **Indexes**: IVFFlat index for vector similarity search
- **Function**: `calculate_reading_time()` helper

**Key Features:**
- Stores 1536-dimensional embeddings for each article
- Tracks all user interactions with dwell time
- Removes global `is_favorited` column (now per-user)
- Adds sentiment tags and TL;DR summaries

### 003: AI Personalization

Implements the complete recommendation engine:

- **Materialized View**: `user_preference_vectors` - aggregated user preferences
- **RPC Functions**:
  - `refresh_user_preference_vector(user_id)` - Update user's preference profile
  - `search_digest_items(embedding, threshold, limit)` - Semantic search
  - `get_personalized_feed(user_id, limit)` - Personalized recommendations
  - `calculate_cosine_similarity(vec_a, vec_b)` - Similarity helper
- **Indexes**: HNSW index for fast vector search

**Key Features:**
- User preference vector = average of embeddings from articles they liked
- Semantic search using cosine similarity
- Personalized feed excludes already-read articles
- Handles cold start (new users with no history)
- Sub-millisecond vector searches with HNSW index

## How Personalization Works

### The AI Recommendation Flow

1. **User Interaction** → User reads/favorites article about "AI agents"
2. **Embedding Capture** → System retrieves article's 1536-dimensional vector
3. **Preference Building** → User's preference vector = average of all liked articles
4. **Similarity Search** → Find articles with embeddings close to user's preference vector
5. **Personalized Feed** → Show articles semantically similar to user's interests

### Example

User likes these articles:
- "New AI Agent Framework Released" (embedding: [0.2, 0.5, 0.1, ...])
- "Building LLM Applications" (embedding: [0.3, 0.4, 0.2, ...])

**User's preference vector = [0.25, 0.45, 0.15, ...]** (average)

System recommends:
- "Claude AI Code Assistant" (embedding: [0.22, 0.48, 0.14, ...]) ← High similarity!
- "GPT-4 API Updates" (embedding: [0.28, 0.43, 0.16, ...]) ← High similarity!

❌ Doesn't recommend:
- "F1 Racing Results" (embedding: [0.9, 0.1, 0.8, ...]) ← Low similarity

## Verification

After applying migrations, verify they worked:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_profiles',
  'user_preferences',
  'user_favorites',
  'user_read_status',
  'user_reading_patterns'
);

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'refresh_user_preference_vector',
  'search_digest_items',
  'get_personalized_feed'
);

-- Check materialized view exists
SELECT matviewname FROM pg_matviews WHERE matviewname = 'user_preference_vectors';

-- Check embedding column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'digest_items' AND column_name = 'embedding';
```

## Troubleshooting

### Error: "extension vector does not exist"

pgvector is not installed on your Supabase instance. Contact Supabase support to enable it.

### Error: "permission denied for schema public"

You need to be a superuser to create extensions. Use the Supabase dashboard SQL editor.

### Error: "relation user_profiles already exists"

Tables already exist. Either:
- Skip migration 001 if tables are correct
- Drop tables and rerun: `DROP TABLE IF EXISTS user_profiles CASCADE;`

### Slow vector searches

HNSW index may not be built yet. Check:

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'digest_items';
```

If `idx_digest_items_embedding_hnsw` is missing, migration 003 failed.

## Next Steps

After applying migrations:

1. **Run the cron job** to generate embeddings:
   ```bash
   curl -X POST "http://localhost:3000/api/cron/daily-digest"
   ```

2. **Create test user** and interact with articles

3. **Check personalization**:
   - Visit `/for-you` page
   - Use semantic search
   - Verify recommendations change based on interactions

4. **Monitor materialized view**:
   ```sql
   SELECT user_id, interaction_count, last_updated
   FROM user_preference_vectors;
   ```

## Rolling Back

To undo migrations (⚠️ WARNING: Destructive):

```sql
-- Drop migration 003
DROP MATERIALIZED VIEW IF EXISTS user_preference_vectors CASCADE;
DROP FUNCTION IF EXISTS refresh_user_preference_vector CASCADE;
DROP FUNCTION IF EXISTS search_digest_items CASCADE;
DROP FUNCTION IF EXISTS get_personalized_feed CASCADE;
DROP FUNCTION IF EXISTS calculate_cosine_similarity CASCADE;

-- Drop migration 002
DROP TABLE IF EXISTS user_reading_patterns CASCADE;
ALTER TABLE digest_items DROP COLUMN IF EXISTS embedding;

-- Drop migration 001
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_read_status CASCADE;
DROP EXTENSION IF EXISTS vector CASCADE;
```

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify Postgres version supports pgvector (14+)
3. Ensure `OPENROUTER_EMBEDDING_API_KEY` is set in `.env.local`
4. Check cron job logs for embedding generation errors
