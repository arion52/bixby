import { supabase, supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from("digest_items")
      .select("is_favorited")
      .eq("id", id)
      .single<{ is_favorited: boolean }>();

    if (fetchError) throw fetchError;
    if (!current) throw new Error("Item not found");

    const newStatus = !current.is_favorited;

    const { error: updateError } = await supabaseAdmin
      .from("digest_items")
      // @ts-expect-error
      .update({ is_favorited: newStatus })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, is_favorited: newStatus });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
