import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!query || query.trim() === "") {
      return NextResponse.json([]);
    }

    const supabase = await createClient();

    // Get authenticated user for personalization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate embedding for search query
    console.log("Generating embedding for query:", query);
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search
    // Using pgvector's <=> operator for cosine distance (lower = more similar)
    const { data: results, error } = await supabase.rpc("search_digest_items", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_threshold: 0.3, // Minimum similarity score (0-1, higher = more similar)
      match_count: limit,
    });

    if (error) {
      console.error("Semantic search error:", error);
      // Fallback to keyword search if semantic search fails
      const { data: fallbackResults } = await supabase
        .from("digest_items")
        .select("*")
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .order("date", { ascending: false })
        .limit(limit);

      return NextResponse.json(fallbackResults || []);
    }

    // If user is logged in, personalize rankings
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (profile) {
        // Get user's preference vector from materialized view
        const { data: userPrefs } = await supabase
          .from("user_preference_vectors")
          .select("preference_vector")
          .eq("user_id", profile.id)
          .single();

        if (userPrefs?.preference_vector) {
          // Re-rank results based on user preferences
          // Combine semantic relevance (70%) with user preference (30%)
          const rerankedResults = results?.map((item: any) => {
            const userSimilarity = calculateSimilarity(
              userPrefs.preference_vector,
              item.embedding
            );
            const combinedScore =
              item.similarity * 0.7 + (userSimilarity || 0) * 0.3;

            return {
              ...item,
              combined_score: combinedScore,
            };
          });

          rerankedResults?.sort((a: any, b: any) => b.combined_score - a.combined_score);

          return NextResponse.json(rerankedResults || []);
        }
      }
    }

    return NextResponse.json(results || []);
  } catch (error) {
    console.error("Semantic search failed:", error);
    return NextResponse.json(
      { error: "Semantic search failed" },
      { status: 500 }
    );
  }
}

// Helper function to calculate cosine similarity (for client-side re-ranking)
function calculateSimilarity(vecA: number[], vecB: number[]): number | null {
  if (!vecA || !vecB || vecA.length !== vecB.length) return null;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return isNaN(similarity) ? null : similarity;
}
