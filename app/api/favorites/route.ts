import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Get favorited items for this user
    const { data: favorites, error } = await supabase
      .from("user_favorites")
      .select("digest_item_id, digest_items(*)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Extract just the digest items
    const items = favorites?.map((fav: any) => fav.digest_items) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
