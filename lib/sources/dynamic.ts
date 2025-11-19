import Parser from "rss-parser";
import { supabase } from "../supabase";
import { Article } from "./rss";

const parser = new Parser();

interface RedditPost {
  data: {
    title: string;
    selftext?: string;
    permalink: string;
    created_utc: number;
  };
}

async function fetchRedditPosts(
  subreddit: string,
  category: string,
  limit = 25
): Promise<Article[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=${limit}`,
      {
        headers: {
          "User-Agent": "DailyDigest/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.children.map((post: RedditPost) => ({
      title: post.data.title,
      summary: post.data.selftext?.substring(0, 300) || "",
      url: `https://reddit.com${post.data.permalink}`,
      source: `r/${subreddit}`,
      category: category,
      publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
    }));
  } catch (error) {
    console.error(`Error fetching Reddit r/${subreddit}:`, error);
    return [];
  }
}

export async function fetchFromAllSources(): Promise<Article[]> {
  try {
    // Fetch all active sources from database
    const { data: sources, error } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    if (!sources) return [];

    const sourcesTyped = sources as {
      id: string;
      url: string;
      name: string;
      category: string;
      is_active: boolean;
    }[];

    const allArticles: Article[] = [];

    for (const source of sourcesTyped) {
      // Handle Reddit sources separately
      if (source.category === "reddit") {
        const subreddit = source.url.replace("r/", "");
        const articles = await fetchRedditPosts(
          subreddit,
          getCategoryForReddit(source.name)
        );
        allArticles.push(...articles);
        continue;
      }

      // Handle RSS feeds
      try {
        const feed = await parser.parseURL(source.url);
        const articles = feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: source.name || feed.title || "Unknown Source",
          category: source.category,
          publishedAt: item.pubDate,
        }));
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching RSS feed ${source.url}:`, error);
      }
    }

    return allArticles;
  } catch (error) {
    console.error("Error fetching from all sources:", error);
    return [];
  }
}

// Map Reddit source names to categories
function getCategoryForReddit(name: string): string {
  if (name.includes("formula1") || name.includes("F1")) return "f1";
  if (
    name.includes("Flutter") ||
    name.includes("django") ||
    name.includes("AndroidDev")
  )
    return "dev_tools";
  if (name.includes("MachineLearning") || name.includes("LocalLLaMA"))
    return "ml_news";
  if (name.includes("Productivity")) return "productivity";
  return "misc";
}
