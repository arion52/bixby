import { processWithAI } from "@/lib/ai";
import { sendDigestEmail } from "@/lib/email";
import { fetchAllReddit } from "@/lib/sources/reddit";
import { fetchF1RSS, fetchMLRSS, fetchTechRSS } from "@/lib/sources/rss";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes max for cron job

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting daily digest cron job...");

    // 1. Fetch from all sources in parallel
    const [f1Articles, techArticles, mlArticles, redditArticles] =
      await Promise.all([
        fetchF1RSS(),
        fetchTechRSS(),
        fetchMLRSS(),
        fetchAllReddit(),
      ]);

    const allArticles = [
      ...f1Articles,
      ...techArticles,
      ...mlArticles,
      ...redditArticles,
    ];

    console.log(`Fetched ${allArticles.length} articles total.`);

    // 2. Process with AI
    const processedItems = await processWithAI(allArticles);
    console.log(`AI processed ${processedItems.length} relevant items.`);

    // 3. Store in Supabase
    if (processedItems.length > 0) {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabaseAdmin.from("digest_items").insert(
        processedItems.map((item) => ({
          date: today,
          ...item,
        })) as any
      );

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // 4. Send email
      await sendDigestEmail(today, processedItems.length);

      // 5. Log success
      await supabaseAdmin.from("digest_runs").insert({
        run_date: today,
        status: "success",
        items_fetched: allArticles.length,
        items_stored: processedItems.length,
      } as any);
    } else {
      console.log("No relevant items found today.");
      const today = new Date().toISOString().split("T")[0];
      await supabaseAdmin.from("digest_runs").insert({
        run_date: today,
        status: "success",
        items_fetched: allArticles.length,
        items_stored: 0,
        error_message: "No relevant items found",
      } as any);
    }

    return NextResponse.json({
      success: true,
      itemsProcessed: processedItems.length,
    });
  } catch (error: any) {
    console.error("Cron job failed:", error);

    // Log failure
    const today = new Date().toISOString().split("T")[0];
    await supabaseAdmin.from("digest_runs").insert({
      run_date: today,
      status: "failed",
      error_message: error.message || String(error),
    } as any);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
