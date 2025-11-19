import { processWithAI } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function GET() {
  const mockArticles = [
    {
      title: "New F1 Regulations for 2026",
      summary:
        "The FIA has announced new regulations for the 2026 season focusing on sustainable fuels.",
      url: "https://example.com/f1",
      source: "The Race",
      category: "f1",
    },
    {
      title: "Next.js 15 Released",
      summary:
        "Vercel has released Next.js 15 with improved caching and partial prerendering.",
      url: "https://example.com/nextjs",
      source: "Vercel",
      category: "dev_tools",
    },
    {
      title: "10 Ways to Bake a Cake",
      summary: "Here are the best recipes for chocolate cake.",
      url: "https://example.com/cake",
      source: "Food Blog",
      category: "misc",
    },
  ];

  try {
    const result = await processWithAI(mockArticles);
    return NextResponse.json({
      success: true,
      input_count: mockArticles.length,
      output_count: result.length,
      results: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
