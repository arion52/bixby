import { processWithAI } from "@/lib/ai";
import { sendDigestEmail } from "@/lib/email";
import { fetchAllReddit } from "@/lib/sources/reddit";
import {
  fetchF1RSS,
  fetchMLRSS,
  fetchProductivityRSS,
  fetchRandomRSS,
  fetchTechRSS,
} from "@/lib/sources/rss";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes max for cron job

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.CRON_SECRET) {
      console.error("Unauthorized cron attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting daily digest cron job...");

    // 1. Fetch from all sources in parallel
    const [
      f1Articles,
      techArticles,
      mlArticles,
      productivityArticles,
      randomArticles,
      redditArticles,
    ] = await Promise.all([
      fetchF1RSS(),
      fetchTechRSS(),
      fetchMLRSS(),
      fetchProductivityRSS(),
      fetchRandomRSS(),
      fetchAllReddit(),
    ]);

    const allArticles = [
      ...f1Articles,
      ...techArticles,
      ...mlArticles,
      ...productivityArticles,
      ...randomArticles,
      ...redditArticles,
    ];

    // Sample latest 15 from each source for balanced processing
    const sampleSize = 15;
    const sampledArticles = [
      ...f1Articles.slice(0, sampleSize),
      ...techArticles.slice(0, sampleSize),
      ...mlArticles.slice(0, sampleSize),
      ...productivityArticles.slice(0, sampleSize),
      ...randomArticles.slice(0, sampleSize),
      ...redditArticles.slice(0, sampleSize),
    ];

    // Shuffle to randomize order and avoid bias
    sampledArticles.sort(() => Math.random() - 0.5);

    console.log(
      `Fetched ${allArticles.length} articles total, sampled ${sampledArticles.length} for processing.`
    );
    console.log("Articles fetched from sources:");
    console.log(`F1 RSS: ${f1Articles.length}`);
    console.log(`Tech RSS: ${techArticles.length}`);
    console.log(`ML RSS: ${mlArticles.length}`);
    console.log(`Productivity RSS: ${productivityArticles.length}`);
    console.log(`Random RSS: ${randomArticles.length}`);
    console.log(`Reddit: ${redditArticles.length}`);

    // 2. Process with AI
    const processedItems = await processWithAI(sampledArticles);
    console.log(`AI processed ${processedItems.length} relevant items.`);
    console.log("Items processed by AI:");
    console.log(processedItems);

    // 3. Store in Supabase
    if (processedItems.length > 0) {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabaseAdmin.from("digest_items").insert(
        processedItems.map((item) => ({
          date: today,
          ...item,
        })) as never
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
        items_fetched: sampledArticles.length,
        items_stored: processedItems.length,
      } as never);
    } else {
      console.log("No relevant items found today.");
      const today = new Date().toISOString().split("T")[0];
      await supabaseAdmin.from("digest_runs").insert({
        run_date: today,
        status: "success",
        items_fetched: sampledArticles.length,
        items_stored: 0,
        error_message: "No relevant items found",
      } as never);
    }

    return NextResponse.json({
      success: true,
      itemsProcessed: processedItems.length,
    });
  } catch (error: unknown) {
    console.error("Cron job failed:", error);

    // Log failure
    const today = new Date().toISOString().split("T")[0];
    await supabaseAdmin.from("digest_runs").insert({
      run_date: today,
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    } as never);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
