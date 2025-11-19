import Parser from "rss-parser";

const parser = new Parser();

export interface Article {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt?: string;
}

export async function fetchProductivityRSS(): Promise<Article[]> {
  const feeds = [
    "https://www.lifehacker.com/rss",
    "https://zapier.com/blog/rss/",
    "https://medium.com/feed/tag/productivity",
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(
        ...(feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: feed.title || "Productivity",
          category: "productivity",
          publishedAt: item.pubDate,
        })) || [])
      );
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }
  return articles;
}

export async function fetchRandomRSS(): Promise<Article[]> {
  const feeds = [
    "https://www.theverge.com/rss/index.xml",
    "https://wired.com/feed/rss",
    "https://techcrunch.com/feed/",
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(
        ...(feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: feed.title || "Random",
          category: "random",
          publishedAt: item.pubDate,
        })) || [])
      );
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}

export async function fetchMLRSS(): Promise<Article[]> {
  const feeds = [
    "https://arxiv.org/rss/cs.LG",
    "https://arxiv.org/rss/cs.CL",
    "https://arxiv.org/rss/stat.ML",
    "https://openai.com/blog/rss.xml",
    "https://huggingface.co/blog/feed.xml",
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(
        ...(feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: feed.title || "ML News",
          category: "ml_news",
          publishedAt: item.pubDate,
        })) || [])
      );
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}

export async function fetchF1RSS(): Promise<Article[]> {
  const feeds = [
    "https://the-race.com/feed/",
    "https://www.autosport.com/rss/feed/f1",
    "https://www.planetf1.com/feed",
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(
        ...(feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: feed.title || "Unknown Source",
          category: "f1",
          publishedAt: item.pubDate,
        })) || [])
      );
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}

export async function fetchTechRSS(): Promise<Article[]> {
  const feeds = [
    "https://hnrss.org/frontpage", // Hacker News
    "https://www.producthunt.com/feed", // Product Hunt
    "https://dev.to/feed",
    "https://blog.jetbrains.com/feed/",
    "https://react.dev/blog/feed.xml",
    "https://vercel.com/changelog/feed.xml",
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(
        ...(feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: feed.title || "Tech News",
          category: "dev_tools",
          publishedAt: item.pubDate,
        })) || [])
      );
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }
  return articles;
}
