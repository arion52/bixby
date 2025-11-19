import Parser from 'rss-parser';

const parser = new Parser();

export interface Article {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt?: string;
}

export async function fetchF1RSS(): Promise<Article[]> {
  const feeds = [
    'https://the-race.com/feed/',
    'https://www.autosport.com/rss/feed/f1',
    'https://www.planetf1.com/feed',
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(...(feed.items.map(item => ({
        title: item.title || 'No Title',
        summary: item.contentSnippet || item.summary || '',
        url: item.link || '',
        source: feed.title || 'Unknown Source',
        category: 'f1',
        publishedAt: item.pubDate,
      })) || []));
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}

export async function fetchTechRSS(): Promise<Article[]> {
  const feeds = [
    'https://news.ycombinator.com/rss', // Hacker News
    'https://www.producthunt.com/feed', // Product Hunt
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(...(feed.items.map(item => ({
        title: item.title || 'No Title',
        summary: item.contentSnippet || item.summary || '',
        url: item.link || '',
        source: feed.title || 'Tech News',
        category: 'dev_tools',
        publishedAt: item.pubDate,
      })) || []));
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}

export async function fetchMLRSS(): Promise<Article[]> {
  const feeds = [
    'http://export.arxiv.org/rss/cs.LG', // ArXiv Machine Learning
    'https://paperswithcode.com/latest/rss', // Papers with Code
  ];

  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      articles.push(...(feed.items.map(item => ({
        title: item.title || 'No Title',
        summary: item.contentSnippet || item.summary || '',
        url: item.link || '',
        source: feed.title || 'ML News',
        category: 'ml_news',
        publishedAt: item.pubDate,
      })) || []));
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
  }

  return articles;
}
