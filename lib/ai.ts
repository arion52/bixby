import { Article } from "./sources/rss";

interface ProcessedItem {
  title: string;
  summary: string;
  tldr: string;
  sentiment: string;
  category: string;
  source_url: string;
  source_name: string;
}

export async function processWithAI(
  articles: Article[]
): Promise<ProcessedItem[]> {
  if (articles.length === 0) return [];

  // Process all sampled articles (up to 90, balanced across sources)
  const articlesToProcess = articles;

  const prompt = `
You are a personal news curator for Jason, a 20-year-old CS student and mobile developer.

Jason's interests:
- Formula 1: Paddock news, driver updates, technical controversies, team politics
- Dev Tools: New CLI tools, productivity apps, VS Code extensions, mobile dev tools (Flutter/Kotlin)
- Machine Learning: New papers, tools, frameworks, practical applications
- Productivity: Personal growth tools, time management apps, note-taking systems

Filter these articles and only include items that:
1. Are genuinely interesting/useful (not clickbait)
2. Provide new information (skip rehashed news)
3. Match Jason's specific interests above

Do not classify everything as F1. Only tag articles that are exclusively about motorsport under 'f1'. Articles about tech, AI, tools, dev, productivity, or general news MUST go into their appropriate categories.

Aim for 8-12 relevant items total, ensuring at least 2 from each main category: f1, dev_tools, ml_news, productivity. If a category has fewer good matches, prioritize quality over quantity.


For each relevant item, provide:
- **Title**: Keep original or make it clearer
- **Summary**: Exactly 2-3 sentences explaining what it is and why it matters to Jason
- **TL;DR**: ONE sentence (10-15 words max) capturing the core point
- **Sentiment**: Choose ONE tag that best describes the tone/content:
  - "drama" - Controversy, gossip, conflicts, scandals
  - "technical" - Deep technical content, complex topics, dense material
  - "breaking" - Time-sensitive news, urgent updates, fresh announcements
  - "hot_take" - Opinion pieces, controversial takes, provocative content
  - "educational" - Tutorials, guides, learning resources, how-tos
  - "neutral" - Standard news, updates, general information
- **Category**: f1, dev_tools, ml_news, productivity, or misc

Articles to process:
${JSON.stringify(
  articlesToProcess.map((a) => ({
    title: a.title,
    summary: a.summary.substring(0, 200), // Truncate for token savings
    url: a.url,
    source: a.source,
  }))
)}

Return ONLY a JSON array:
[
  {
    "title": "...",
    "summary": "...",
    "tldr": "...",
    "sentiment": "...",
    "category": "...",
    "source_url": "...",
    "source_name": "..."
  }
]

Be selective but comprehensive. Prioritize quality, but ensure coverage across categories.
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jacyverse.tech", // Optional
          "X-Title": "Personal Daily Digest", // Optional
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `OpenRouter API error: ${response.statusText}`,
        await response.text()
      );
      console.log("model used: deepseek/deepseek-r1-0528:free");
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from markdown code block if present
    const jsonMatch =
      content.match(/```json\n([\s\S]*?)\n```/) ||
      content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const processedItems: ProcessedItem[] = JSON.parse(jsonString);
    return processedItems;
  } catch (error) {
    console.error("AI processing failed:", error);
    // Fallback: return empty or handle gracefully
    return [];
  }
}
