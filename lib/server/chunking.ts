/**
 * Text chunking utilities for creating paragraph-based chunks with overlap
 *
 * This module provides intelligent text chunking optimized for embedding generation.
 * It splits long texts into manageable chunks (250-500 tokens) while preserving
 * context through overlapping content between consecutive chunks.
 *
 * Primary Strategy:
 * - Chunks are created from paragraphs (split on double newlines)
 * - Target size: 250-500 tokens per chunk
 * - 15% overlap between consecutive chunks to preserve context
 * - Falls back to sentence-level splitting for oversized paragraphs
 *
 * Uses tiktoken for accurate OpenAI token counting (cl100k_base encoding)
 * to ensure chunks stay within embedding model limits.
 *
 * Usage:
 *   const chunks = chunkText(articleText);
 *   // Process chunks...
 *   freeEncoder(); // Clean up when done
 */
import { encoding_for_model } from 'tiktoken';

// Chunking configuration constants
const MIN_CHUNK_TOKENS = 250; // Minimum tokens to create a chunk
const MAX_CHUNK_TOKENS = 500; // Maximum tokens before splitting
const OVERLAP_PERCENTAGE = 0.15; // 15% overlap to preserve context across chunks

// Singleton encoder instance to avoid repeated initialization overhead
let encoderInstance: ReturnType<typeof encoding_for_model> | null = null;

/**
 * Get or create the singleton tiktoken encoder instance
 * Uses cl100k_base encoding (same as text-embedding-3-large)
 */
function getEncoder() {
  if (!encoderInstance) {
    encoderInstance = encoding_for_model('text-embedding-3-large');
  }
  return encoderInstance;
}

/**
 * Count tokens in text using tiktoken
 */
export function countTokens(text: string): number {
  const encoder = getEncoder();
  const tokens = encoder.encode(text);
  return tokens.length;
}

/**
 * Split text into sentences using simple heuristics
 *
 * Splits on punctuation (. ! ?) followed by whitespace. This is a fallback
 * for oversized paragraphs that exceed MAX_CHUNK_TOKENS.
 *
 * Limitations:
 * - Abbreviations (e.g., i.e.) may cause false splits
 * - Ellipsis (...) might be treated as sentence end
 * - Acceptable for crypto articles: decimals like "0.5 BTC" work correctly
 *   since periods in numbers aren't followed by spaces
 *
 * @param text - The text to split into sentences
 * @returns Array of sentences with their trailing punctuation
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries: . ! ? followed by space or newline
  const sentences = text
    .split(/([.!?]+[\s\n]+)/)
    .reduce((acc: string[], part, i, arr) => {
      // Combine sentence content with its delimiter (punctuation + space)
      if (i % 2 === 0 && i + 1 < arr.length) {
        acc.push(part + arr[i + 1]);
      } else if (i % 2 === 0) {
        // Last part (no delimiter following)
        acc.push(part);
      }
      return acc;
    }, [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

export interface Chunk {
  content: string;
  tokenCount: number;
  chunkIndex: number;
}

/**
 * Chunk text into overlapping segments optimized for embeddings
 *
 * Primary Strategy:
 * 1. Split text into paragraphs (double newline boundaries)
 * 2. Combine paragraphs into chunks of 250-500 tokens
 * 3. Add 15% overlap between consecutive chunks
 * 4. For oversized paragraphs, fall back to sentence-level splitting
 *
 * @param text - The text to chunk (typically article content)
 * @returns Array of chunks with content, token count, and index
 */
export function chunkText(text: string): Chunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Step 1: Split into paragraphs (primary chunking boundary)
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: Chunk[] = [];
  let currentChunk: string[] = []; // Accumulator for paragraphs in current chunk
  let currentTokens = 0; // Running token count for current chunk

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph);

    // Step 2: Handle oversized paragraphs by splitting into sentences
    if (paragraphTokens > MAX_CHUNK_TOKENS) {
      // First, save any accumulated paragraphs as a chunk
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join('\n\n'),
          tokenCount: currentTokens,
          chunkIndex: chunks.length,
        });
        currentChunk = [];
        currentTokens = 0;
      }

      // Split oversized paragraph into sentences
      const sentences = splitIntoSentences(paragraph);
      let sentenceBuffer: string[] = [];
      let sentenceTokens = 0;

      for (const sentence of sentences) {
        const sentenceTokenCount = countTokens(sentence);

        // Check if adding this sentence would exceed max tokens
        if (sentenceTokens + sentenceTokenCount > MAX_CHUNK_TOKENS && sentenceBuffer.length > 0) {
          // Save current sentences as a chunk
          chunks.push({
            content: sentenceBuffer.join(' '),
            tokenCount: sentenceTokens,
            chunkIndex: chunks.length,
          });

          // Create overlap: keep last 15% of sentences
          const overlapSize = Math.floor(sentenceBuffer.length * OVERLAP_PERCENTAGE);
          sentenceBuffer = overlapSize > 0 ? sentenceBuffer.slice(-overlapSize) : [];
          sentenceTokens = sentenceBuffer.length > 0 ? countTokens(sentenceBuffer.join(' ')) : 0;
        }

        sentenceBuffer.push(sentence);
        sentenceTokens += sentenceTokenCount;
      }

      // Save remaining sentences from oversized paragraph
      if (sentenceBuffer.length > 0) {
        chunks.push({
          content: sentenceBuffer.join(' '),
          tokenCount: sentenceTokens,
          chunkIndex: chunks.length,
        });
      }

      continue; // Move to next paragraph
    }

    // Step 3: Accumulate paragraphs into chunks
    // Check if adding this paragraph would exceed max tokens
    if (currentTokens + paragraphTokens > MAX_CHUNK_TOKENS && currentChunk.length > 0) {
      // Save current accumulated chunk
      chunks.push({
        content: currentChunk.join('\n\n'),
        tokenCount: currentTokens,
        chunkIndex: chunks.length,
      });

      // Create overlap: keep last 15% of paragraphs from previous chunk
      const overlapSize = Math.floor(currentChunk.length * OVERLAP_PERCENTAGE);
      if (overlapSize > 0) {
        const overlapParagraphs = currentChunk.slice(-overlapSize);
        currentChunk = overlapParagraphs;
        currentTokens = countTokens(currentChunk.join('\n\n'));
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }

    // Add paragraph to current chunk accumulator
    currentChunk.push(paragraph);
    currentTokens += paragraphTokens;

    // Step 4: Save chunk if it's reached optimal size (250-500 tokens)
    if (currentTokens >= MIN_CHUNK_TOKENS && currentTokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        content: currentChunk.join('\n\n'),
        tokenCount: currentTokens,
        chunkIndex: chunks.length,
      });

      // Start new chunk with overlap from this chunk
      const overlapSize = Math.floor(currentChunk.length * OVERLAP_PERCENTAGE);
      if (overlapSize > 0) {
        const overlapParagraphs = currentChunk.slice(-overlapSize);
        currentChunk = overlapParagraphs;
        currentTokens = countTokens(currentChunk.join('\n\n'));
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }
  }

  // Step 5: Save any remaining accumulated content as final chunk
  if (currentChunk.length > 0 && currentTokens > 0) {
    chunks.push({
      content: currentChunk.join('\n\n'),
      tokenCount: currentTokens,
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}

/**
 * Free the encoder resources when done
 */
export function freeEncoder() {
  if (encoderInstance) {
    encoderInstance.free();
    encoderInstance = null;
  }
}
