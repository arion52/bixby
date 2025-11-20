import { processWithAI } from "@/lib/ai";
import { sendDigestEmail } from "@/lib/email";
import { fetchFromAllSources } from "@/lib/sources/dynamic";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbeddingBatch, createEmbeddingText } from "@/lib/embeddings";
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

    // 1. Fetch from all active sources dynamically
    const allArticles = await fetchFromAllSources();

    // Group by category for balanced sampling
    const byCategory = allArticles.reduce((acc, article) => {
      if (!acc[article.category]) acc[article.category] = [];
      acc[article.category].push(article);
      return acc;
    }, {} as Record<string, typeof allArticles>);

    // Sample 15 from each category for balanced processing
    const sampleSize = 15;
    const sampledArticles = Object.values(byCategory)
      .flatMap(articles => articles.slice(0, sampleSize));

    // Shuffle to randomize order and avoid bias
    sampledArticles.sort(() => Math.random() - 0.5);

    console.log(
      `Fetched ${allArticles.length} articles total, sampled ${sampledArticles.length} for processing.`
    );
    console.log("Articles by category:");
    Object.entries(byCategory).forEach(([cat, articles]) => {
      console.log(`${cat}: ${articles.length}`);
    });

    // 2. Process with AI
    const processedItems = await processWithAI(sampledArticles);
    console.log(`AI processed ${processedItems.length} relevant items.`);
    console.log("Items processed by AI:");
    console.log(processedItems);

    // 3. Generate embeddings for all processed items
    console.log("Generating embeddings for semantic search...");
    const embeddingTexts = processedItems.map((item) =>
      createEmbeddingText({
        title: item.title,
        summary: item.summary,
        category: item.category,
      })
    );

    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddingBatch(embeddingTexts);
      console.log(`Generated ${embeddings.length} embeddings`);
    } catch (error) {
      console.error("Failed to generate embeddings, continuing without them:", error);
      // Continue without embeddings if it fails - don't block the whole digest
    }

    // 4. Store in Supabase with embeddings
    if (processedItems.length > 0) {
      const today = new Date().toISOString().split("T")[0];

      const itemsWithEmbeddings = processedItems.map((item, index) => ({
        date: today,
        ...item,
        embedding: embeddings[index] ? `[${embeddings[index].join(",")}]` : null,
      }));

      const { error } = await supabaseAdmin.from("digest_items").insert(
        itemsWithEmbeddings as never
      );

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // 5. Send email
      await sendDigestEmail(today, processedItems.length);

      // 6. Log success
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
