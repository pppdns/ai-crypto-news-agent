import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { parseCitations } from '@/lib/server/rag/citations';
import { getAnswerPrompt } from '@/lib/server/rag/prompts';
import { Citation } from '@/lib/server/rag/types';
import { executeRAGWorkflow } from '@/lib/server/rag/workflow';

export const maxDuration = 30;

interface RequestBody {
  query: string;
}

interface CleanedTextMessage {
  type: 'cleanedText';
  text: string;
}

interface CitationsMessage {
  type: 'citations';
  citations: Citation[];
}

export async function POST(req: Request) {
  try {
    const { query }: RequestBody = await req.json();

    if (!query || !query.trim()) {
      return new Response('No user query provided', { status: 400 });
    }
    console.log(`Processing query: "${query}"`);

    // Execute RAG workflow (non-streaming for retrieval)
    const ragResult = await executeRAGWorkflow(query);

    // Handle errors
    if (ragResult.error) {
      console.error('RAG workflow error:', ragResult.error);
      return new Response(
        JSON.stringify({
          error: 'Failed to process query',
          message: ragResult.error,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Handle "No recent news" case
    if (ragResult.answer === 'No recent news' || ragResult.rerankedChunks.length === 0) {
      console.log('No relevant results found');

      // Stream a simple response
      const result = streamText({
        model: openai('gpt-4o-mini'),
        prompt: 'Respond with exactly: "No recent news"',
      });

      return result.toTextStreamResponse();
    }

    // Stream the answer with citations
    console.log('Streaming answer with citations...');

    // Generate prompt with context
    const prompt = getAnswerPrompt(query, ragResult.rerankedChunks);

    // Stream using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.3,
    });

    // Create a custom stream that includes citations at the end
    const stream = result.textStream;
    let fullText = '';

    const transformStream = new TransformStream<string, string>({
      async transform(chunk: string, controller: TransformStreamDefaultController<string>) {
        fullText += chunk;
        controller.enqueue(chunk);
      },
      async flush(controller: TransformStreamDefaultController<string>) {
        // Parse citations after streaming completes
        const { text: cleanedText, citations } = await parseCitations(fullText);
        console.log(`Parsed ${citations.length} citations from response`);

        // Send cleaned text replacement message
        const cleanedTextMessage: CleanedTextMessage = {
          type: 'cleanedText',
          text: cleanedText,
        };
        controller.enqueue(`\ndata: ${JSON.stringify(cleanedTextMessage)}\n\n`);

        // Send citations as a data message
        const citationsMessage: CitationsMessage = {
          type: 'citations',
          citations,
        };
        controller.enqueue(`\ndata: ${JSON.stringify(citationsMessage)}\n\n`);
      },
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
