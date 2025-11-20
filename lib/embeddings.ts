/**
 * Embedding generation utilities using OpenRouter
 * Uses text-embedding-3-small for cost-effective semantic search
 */

const OPENROUTER_EMBEDDING_API_KEY = process.env.OPENROUTER_EMBEDDING_API_KEY;
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embedding vector for a piece of text
 * @param text - The text to generate embedding for
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENROUTER_EMBEDDING_API_KEY) {
    throw new Error("OPENROUTER_EMBEDDING_API_KEY is not set");
  }

  // Truncate text if too long (models have token limits)
  const truncatedText = text.substring(0, 8000); // ~2000 tokens

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_EMBEDDING_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Bixby AI News Digest",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: EmbeddingResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No embedding returned from API");
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingBatch(
  texts: string[]
): Promise<number[][]> {
  if (!OPENROUTER_EMBEDDING_API_KEY) {
    throw new Error("OPENROUTER_EMBEDDING_API_KEY is not set");
  }

  // Truncate each text
  const truncatedTexts = texts.map((text) => text.substring(0, 8000));

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_EMBEDDING_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Bixby AI News Digest",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedTexts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: EmbeddingResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No embeddings returned from API");
    }

    // Sort by index to maintain order
    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    console.error("Failed to generate embeddings batch:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Similarity score between -1 and 1 (1 = identical)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Create a combined text representation for embedding generation
 * Combines title, summary, and category for better semantic representation
 */
export function createEmbeddingText(item: {
  title: string;
  summary: string;
  category: string;
}): string {
  return `Title: ${item.title}\n\nCategory: ${item.category}\n\nSummary: ${item.summary}`;
}
