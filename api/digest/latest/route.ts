import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the most recent date that has items
    const { data: latestDateData, error: dateError } = await supabase
      .from("digest_items")
      .select("date")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (dateError || !latestDateData) {
      return NextResponse.json({ items: [], date: null });
    }

    const latestDate = (latestDateData as { date: string }).date;

    const { data: items, error: itemsError } = await supabase
      .from("digest_items")
      .select("*")
      .eq("date", latestDate)
      .order("category", { ascending: true });

    if (itemsError) throw itemsError;

    return NextResponse.json({ items, date: latestDate });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}
