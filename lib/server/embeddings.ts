/**
 * OpenAI embedding generation utilities
 * Uses text-embedding-3-large with 1536 dimensions for pgvector 0.8.0 HNSW compatibility
 */
import OpenAI from 'openai';

// Constants for embedding generation
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536; // Reduced from 3072 for pgvector 0.8.0 HNSW support

// Create OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * L2-normalize a vector
 * Ensures the vector has unit length for cosine similarity operations
 */
function l2Normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map((val) => val / magnitude);
}

/**
 * Generate embedding for a single text
 * Returns L2-normalized embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Get the embedding vector
    const embedding = response.data[0].embedding;

    // L2-normalize the embedding
    return l2Normalize(embedding);
  } catch (error: unknown) {
    console.error('Failed to generate embedding:', error);
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate embeddings for multiple texts in a batch
 * Returns L2-normalized embedding vectors
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Filter out empty texts
  const validTexts = texts.filter((text) => text && text.trim().length > 0);

  if (validTexts.length === 0) {
    return [];
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Extract embeddings and L2-normalize them
    return response.data.map((item) => l2Normalize(item.embedding));
  } catch (error: unknown) {
    console.error('Failed to generate embeddings:', error);
    throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
