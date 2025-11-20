# 🚀 Quick Start: AI Personalization

**TL;DR:** Apply 3 SQL migrations, run cron job, test. That's it!

---

## Step 1: Apply Migrations (5 minutes)

Go to **Supabase Dashboard → SQL Editor**:

### Migration 1: Auth Tables
Copy and paste `supabase/migrations/001_enable_pgvector_and_create_auth_tables.sql`
→ Click **Run** → ✅ Should succeed

### Migration 2: Embeddings
Copy and paste `supabase/migrations/002_add_embeddings_and_reading_patterns.sql`
→ Click **Run** → ✅ Should succeed

### Migration 3: Personalization
Copy and paste `supabase/migrations/003_implement_preference_vectors.sql`
→ Click **Run** → ✅ Should succeed

---

## Step 2: Generate Embeddings (1 minute)

```bash
# Make sure OPENROUTER_EMBEDDING_API_KEY is in .env.local
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/daily-digest

# Or for production:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/daily-digest
```

---

## Step 3: Test (2 minutes)

1. **Create test account** at `/signup`
2. **Favorite 5 articles** from one category
3. **Visit `/for-you`** → Should see relevant recommendations
4. **Search** for something → Should see personalized results

---

## Verify It's Working

```sql
-- Check embeddings exist
SELECT COUNT(embedding) FROM digest_items;
-- Should be > 0

-- Check your preference vector
SELECT * FROM user_preference_vectors
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'your-email@example.com');
-- Should return 1 row after you favorite some articles
```

---

## What Changed?

**Before:**
- ❌ Recommendations were just recent articles
- ❌ Search was keyword-only
- ❌ Same results for everyone

**After:**
- ✅ Recommendations based on YOUR reading history
- ✅ Search understands meaning (semantic search)
- ✅ Results personalized to YOUR interests

---

## Need Help?

- **Full Guide**: `PERSONALIZATION_IMPLEMENTATION.md`
- **Migration Details**: `supabase/migrations/README.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

**That's it! You now have AI-powered personalization.** 🎉
