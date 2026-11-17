import { after } from 'next/server';
import { startObservation } from '@langfuse/tracing';
import { ROOT_CONTEXT, context, trace } from '@opentelemetry/api';
import { NO_RECENT_NEWS, generateAnswerStream } from '@/lib/server/rag/answer';
import { parseCitations } from '@/lib/server/rag/citations';
import { Citation } from '@/lib/server/rag/types';
import { executeRAGWorkflow } from '@/lib/server/rag/workflow';
import { flushTraces } from '@/lib/server/tracing';

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

interface ErrorMessage {
  type: 'error';
  message: string;
}

export async function POST(req: Request) {
  // Root Langfuse observation for the whole request; LangGraph nodes and the answer generation nest under it.
  // It is ended manually because the answer keeps streaming after this handler returns, and it is started
  // from ROOT_CONTEXT so it is the trace root in Langfuse (Next.js's own HTTP span is not exported there).
  const rootSpan = context.with(ROOT_CONTEXT, () => startObservation('ask', {}, { asType: 'agent' }));
  const rootContext = trace.setSpan(context.active(), rootSpan.otelSpan);
  after(flushTraces);

  try {
    const { query }: RequestBody = await req.json();

    if (!query || !query.trim()) {
      rootSpan.update({ level: 'WARNING', statusMessage: 'Empty query' }).end();
      return new Response('No user query provided', { status: 400 });
    }
    console.log(`Processing query: "${query}"`);
    rootSpan.update({ input: { query } });

    // Execute RAG workflow (non-streaming for retrieval)
    const ragResult = await context.with(rootContext, () => executeRAGWorkflow(query));

    // Handle errors
    if (ragResult.error) {
      console.error('RAG workflow error:', ragResult.error);
      rootSpan.update({ level: 'ERROR', statusMessage: ragResult.error }).end();
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

    // Handle "No recent news" case: no context, so no LLM call is needed
    if (ragResult.rerankedChunks.length === 0) {
      console.log('No relevant results found');
      rootSpan
        .update({
          output: NO_RECENT_NEWS,
          metadata: { temporalWindowDays: ragResult.temporalWindow, contextChunks: 0 },
        })
        .end();
      return new Response(NO_RECENT_NEWS, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    // Stream the answer with citations
    console.log('Streaming answer with citations...');

    const result = context.with(rootContext, () => generateAnswerStream(query, ragResult.rerankedChunks));

    const outputStream = new ReadableStream<string>({
      async start(controller) {
        let fullText = '';

        try {
          for await (const chunk of result.textStream) {
            fullText += chunk;
            controller.enqueue(chunk);
          }

          const { text: cleanedText, citations } = await parseCitations(fullText);
          console.log(`Parsed ${citations.length} citations from response`);

          const cleanedTextMessage: CleanedTextMessage = {
            type: 'cleanedText',
            text: cleanedText,
          };
          controller.enqueue(`\ndata: ${JSON.stringify(cleanedTextMessage)}\n\n`);

          const citationsMessage: CitationsMessage = {
            type: 'citations',
            citations,
          };
          controller.enqueue(`\ndata: ${JSON.stringify(citationsMessage)}\n\n`);

          rootSpan.update({
            output: fullText,
            metadata: {
              temporalWindowDays: ragResult.temporalWindow,
              candidates: ragResult.candidates.length,
              contextChunks: ragResult.rerankedChunks.length,
              citedArticleIds: citations.map((c) => c.articleId),
            },
          });
        } catch (error) {
          console.error('Answer stream error:', error);
          const message = error instanceof Error ? error.message : String(error);
          rootSpan.update({ level: 'ERROR', statusMessage: message });
          const errorMessage: ErrorMessage = {
            type: 'error',
            message,
          };
          controller.enqueue(`\ndata: ${JSON.stringify(errorMessage)}\n\n`);
        } finally {
          rootSpan.end();
          controller.close();
        }
      },
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Request error:', error);
    const message = error instanceof Error ? error.message : String(error);
    rootSpan.update({ level: 'ERROR', statusMessage: message }).end();
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
