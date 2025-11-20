import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * Get personalized feed based on user's reading history
 * Uses vector similarity to recommend articles similar to what the user has read/favorited
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");

    // Call personalized feed function
    const { data: feed, error } = await supabase.rpc("get_personalized_feed", {
      p_user_id: profile.id,
      p_limit: limit,
    });

    if (error) {
      console.error("Personalized feed error:", error);
      console.log("Falling back to recent items (user may not have interaction history yet)");
      // Fallback to recent items
      const { data: fallbackFeed } = await supabase
        .from("digest_items")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      return NextResponse.json({ items: fallbackFeed || [], personalized: false });
    }

    // If feed is empty (cold start - no interactions yet), fallback to recent
    if (!feed || feed.length === 0) {
      console.log("User has no personalized recommendations yet, showing recent items");
      const { data: fallbackFeed } = await supabase
        .from("digest_items")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      return NextResponse.json({ items: fallbackFeed || [], personalized: false });
    }

    return NextResponse.json({ items: feed || [], personalized: true });
  } catch (error) {
    console.error("Failed to get personalized feed:", error);
    return NextResponse.json(
      { error: "Failed to get personalized feed" },
      { status: 500 }
    );
  }
}
