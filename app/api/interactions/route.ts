import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * Track user interactions with digest items
 * Used to build user preference vectors for personalization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { digest_item_id, interaction_type, dwell_time_seconds } = body;

    if (!digest_item_id || !interaction_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Valid interaction types
    const validTypes = ["click", "read", "favorite", "skip"];
    if (!validTypes.includes(interaction_type)) {
      return NextResponse.json(
        { error: "Invalid interaction type" },
        { status: 400 }
      );
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

    // Record interaction
    const { error } = await supabase.from("user_reading_patterns").insert({
      user_id: profile.id,
      digest_item_id,
      interaction_type,
      dwell_time_seconds: dwell_time_seconds || 0,
    });

    if (error) {
      console.error("Failed to record interaction:", error);
      throw error;
    }

    // Refresh user preference vector in background (async, don't wait)
    // This updates the materialized view for personalized recommendations
    void supabase.rpc("refresh_user_preference_vector", {
      p_user_id: profile.id,
    }).then(() => {
      console.log("User preference vector refreshed for user:", profile.id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record interaction:", error);
    return NextResponse.json(
      { error: "Failed to record interaction" },
      { status: 500 }
    );
  }
}
