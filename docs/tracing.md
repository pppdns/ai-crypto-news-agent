# Tracing (Langfuse)

Every `/ask` request is recorded as one [Langfuse](https://langfuse.com) trace through OpenTelemetry:

```
AGENT ask                                   input: query · output: answer · metadata: window, candidates, cited IDs
├── CHAIN rag-workflow                      LangGraph run
│   ├── SPAN detect-temporal-window         query → recency window (days)
│   ├── EMBEDDING embed-query               text-embedding-3-large, 1536 dims
│   ├── RETRIEVER hybrid-search             query, window, limit → ranked article IDs, titles, scores
│   └── SPAN skip-rerank | rerank           rerank → one GENERATION rerank-score per chunk (gpt-4o-mini)
└── SPAN answer-generation                  AI SDK streamText
    └── GENERATION …doStream                prompt, completion, model, tokens, cost, time to first token
```

The "No recent news" path ends after `hybrid-search` with no LLM call.

## How it is wired

| Piece                                   | Where                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Span processor, flush, standalone setup | `lib/server/tracing.ts`                                                   |
| Registration                            | `sentry.server.config.ts` (loaded from `instrumentation.ts`)              |
| Root `ask` observation                  | `app/ask/route.ts` (ended when the stream closes, flushed with `after()`) |
| Workflow and node observations          | `lib/server/rag/workflow.ts`                                              |
| Answer generation telemetry             | `lib/server/rag/answer.ts` (`experimental_telemetry`)                     |
| Reranker calls                          | `lib/server/rag/reranker.ts` (`observeOpenAI`)                            |

- **Sentry coexistence.** Sentry owns the global OpenTelemetry provider when it is enabled (production), so the
  Langfuse processor is passed in via `openTelemetrySpanProcessors`. With Sentry disabled (local dev, eval runs) a plain
  `NodeTracerProvider` is registered instead.
- **One OpenTelemetry API copy.** `pnpm-workspace.yaml` pins `@opentelemetry/api` to a single version. With two minor
  versions installed, Sentry's provider was invisible to Langfuse and the AI SDK, and traces fell apart into fragments.
- **Filtering.** Only LLM-related spans are exported (Langfuse's default filter). PromptFoo's own judge calls are
  excluded, so eval traces show the system under test, not the grader.
- **Serverless.** On Vercel the processor exports immediately and `after(flushTraces)` flushes before the function freezes.
- **Optional.** Without `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` tracing is a no-op. Export failures are logged,
  never thrown.

## Configuration

| Variable                       | Purpose                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `LANGFUSE_PUBLIC_KEY`          | Project public key                                                            |
| `LANGFUSE_SECRET_KEY`          | Project secret key                                                            |
| `LANGFUSE_BASE_URL`            | Region host, e.g. `https://us.cloud.langfuse.com` (default is the EU cloud)   |
| `LANGFUSE_TRACING_ENVIRONMENT` | Optional override; defaults to `VERCEL_ENV` / `NODE_ENV`, `eval` in eval runs |

Set them in `.env.local` for local dev and in the Vercel project for production.
