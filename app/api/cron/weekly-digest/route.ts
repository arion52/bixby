import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.CRON_SECRET) {
      console.error("Unauthorized cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting weekly digest cron job...");

    // Get date range (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    // Fetch most favorited articles from last week
    const { data: favoritedArticles } = await supabase
      .from('digest_items')
      .select('*')
      .eq('is_favorited', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch most read articles from last week
    const { data: readArticles } = await supabase
      .from('digest_items')
      .select('*')
      .eq('is_read', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: false })
      .limit(10);

    // Combine and deduplicate
    const allArticles = [...(favoritedArticles || []), ...(readArticles || [])];
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.id, item])).values()
    ).slice(0, 20);

    // Generate AI summary of weekly trends
    const categoryBreakdown = uniqueArticles.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weeklyInsight = await generateWeeklyInsight(categoryBreakdown, uniqueArticles.length);

    // Store weekly digest (optional - you can skip this if you just want email)
    await supabaseAdmin.from('digest_runs').insert({
      run_date: endDate,
      status: 'success',
      items_fetched: uniqueArticles.length,
      items_stored: uniqueArticles.length,
      error_message: `Weekly digest: ${weeklyInsight}`,
    } as never);

    // Send weekly email (you'll need to create this function)
    // await sendWeeklyDigestEmail(uniqueArticles, weeklyInsight);

    return NextResponse.json({
      success: true,
      articlesIncluded: uniqueArticles.length,
      insight: weeklyInsight,
      categories: categoryBreakdown,
    });
  } catch (error: unknown) {
    console.error("Weekly digest cron failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function generateWeeklyInsight(
  categories: Record<string, number>,
  totalArticles: number
): Promise<string> {
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  if (!topCategory) {
    return "Not much activity this week.";
  }

  const [category, count] = topCategory;
  const percentage = Math.round((count / totalArticles) * 100);

  return `Your focus this week: ${percentage}% ${category.replace('_', ' ')}, with ${totalArticles} engaged articles total.`;
}
