import { Article } from "./rss";

interface RedditPostData {
  title: string;
  selftext?: string;
  permalink: string;
  created_utc: number;
}

interface RedditPost {
  data: RedditPostData;
}

export async function fetchRedditPosts(
  subreddit: string,
  category: string,
  limit = 25
): Promise<Article[]> {
  // If Reddit integration is disabled via env, skip fetching to avoid 403/429
  if (process.env.ENABLE_REDDIT !== "true") {
    console.warn(
      `Reddit fetching disabled (ENABLE_REDDIT != true). Skipping r/${subreddit}`
    );
    return [];
  }
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

export async function fetchAllReddit(): Promise<Article[]> {
  const sources = [
    { subreddit: "formula1", category: "f1" },
    { subreddit: "F1Technical", category: "f1" },
    { subreddit: "FlutterDev", category: "dev_tools" },
    { subreddit: "django", category: "dev_tools" },
    { subreddit: "MachineLearning", category: "ml_news" },
    { subreddit: "LocalLLaMA", category: "ml_news" },
    { subreddit: "Productivity", category: "productivity" },
    { subreddit: "AndroidDev", category: "dev_tools" },
    { subreddit: "coolguides", category: "random" },
  ];

  const allArticles: Article[] = [];

  for (const source of sources) {
    const articles = await fetchRedditPosts(source.subreddit, source.category);
    allArticles.push(...articles);
  }

  return allArticles;
}
