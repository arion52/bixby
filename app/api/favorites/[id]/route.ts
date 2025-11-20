import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Check if already favorited
    const { data: existing } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", profile.id)
      .eq("digest_item_id", id)
      .single();

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", profile.id)
        .eq("digest_item_id", id);

      if (error) throw error;

      return NextResponse.json({ success: true, is_favorited: false });
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("user_favorites")
        .insert({ user_id: profile.id, digest_item_id: id });

      if (error) throw error;

      return NextResponse.json({ success: true, is_favorited: true });
    }
  } catch (error) {
    console.error("Failed to update favorite:", error);
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
