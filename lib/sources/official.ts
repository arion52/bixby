import * as cheerio from "cheerio";
import Parser from "rss-parser";
import { Article } from "./rss";

const parser = new Parser();

export async function fetchAnthropicNews(): Promise<Article[]> {
  try {
    const response = await fetch("https://www.anthropic.com/news", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BixbyDigest/1.0;)",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Anthropic News: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    // This selector might need adjustment based on actual HTML structure
    // Looking for links that go to /news/ and have substantial text
    $("a[href^='/news/']").each((_: number, element: any) => {
      const href = $(element).attr("href");
      const title = $(element).text().trim();
      
      // Filter out navigation links or short links
      if (!href || href === "/news" || title.length < 10) return;

      // Try to find a summary or date nearby
      // This is a heuristic; actual structure might differ
      const summary = $(element).closest("div").find("p").text().trim() || "";
      
      // Avoid duplicates
      if (articles.some(a => a.url.includes(href))) return;

      articles.push({
        title: title,
        summary: summary,
        url: `https://www.anthropic.com${href}`,
        source: "Anthropic News",
        category: "official_news",
        publishedAt: new Date().toISOString(), // Fallback date
      });
    });

    return articles.slice(0, 5); // Limit to recent ones
  } catch (error) {
    console.error("Error fetching Anthropic News:", error);
    return [];
  }
}

export async function fetchAnthropicEngineering(): Promise<Article[]> {
  try {
    const response = await fetch("https://www.anthropic.com/engineering", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BixbyDigest/1.0;)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Anthropic Engineering: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    $("a[href^='/engineering/']").each((_: number, element: any) => {
      const href = $(element).attr("href");
      const title = $(element).text().trim();

      if (!href || href === "/engineering" || title.length < 10) return;

      const summary = $(element).closest("div").find("p").text().trim() || "";

      if (articles.some(a => a.url.includes(href))) return;

      articles.push({
        title: title,
        summary: summary,
        url: `https://www.anthropic.com${href}`,
        source: "Anthropic Engineering",
        category: "official_news",
        publishedAt: new Date().toISOString(),
      });
    });

    return articles.slice(0, 5);
  } catch (error) {
    console.error("Error fetching Anthropic Engineering:", error);
    return [];
  }
}

export async function fetchOpenAINews(): Promise<Article[]> {
  try {
    const feed = await parser.parseURL("https://openai.com/news/rss.xml");
    return feed.items.map((item) => ({
      title: item.title || "No Title",
      summary: item.contentSnippet || item.summary || "",
      url: item.link || "",
      source: "OpenAI News",
      category: "official_news",
      publishedAt: item.pubDate,
    })).slice(0, 5);
  } catch (error) {
    console.error("Error fetching OpenAI News:", error);
    // Fallback to blog feed if news feed fails
    try {
        const feed = await parser.parseURL("https://openai.com/blog/rss.xml");
        return feed.items.map((item) => ({
          title: item.title || "No Title",
          summary: item.contentSnippet || item.summary || "",
          url: item.link || "",
          source: "OpenAI Blog",
          category: "official_news",
          publishedAt: item.pubDate,
        })).slice(0, 5);
    } catch (e) {
        console.error("Error fetching OpenAI Blog:", e);
        return [];
    }
  }
}

export async function fetchGoogleAIBlog(): Promise<Article[]> {
  try {
    const feed = await parser.parseURL("https://blog.google/technology/ai/rss/");
    return feed.items.map((item) => ({
      title: item.title || "No Title",
      summary: item.contentSnippet || item.summary || "",
      url: item.link || "",
      source: "Google AI Blog",
      category: "official_news",
      publishedAt: item.pubDate,
    })).slice(0, 5);
  } catch (error) {
    console.error("Error fetching Google AI Blog:", error);
    return [];
  }
}

export async function fetchOfficialSources(): Promise<Article[]> {
  const [anthropicNews, anthropicEng, openai, google] = await Promise.all([
    fetchAnthropicNews(),
    fetchAnthropicEngineering(),
    fetchOpenAINews(),
    fetchGoogleAIBlog(),
  ]);

  return [...anthropicNews, ...anthropicEng, ...openai, ...google];
}
