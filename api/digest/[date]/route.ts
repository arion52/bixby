import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  try {
    const { data: items, error } = await supabase
      .from("digest_items")
      .select("*")
      .eq("date", date)
      .order("category", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items, date });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}
