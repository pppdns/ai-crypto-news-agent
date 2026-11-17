# Evals

PromptFoo suites for the RAG pipeline: deterministic, retrieval, generation and red team.

```bash
pnpm eval            # deterministic + generation
pnpm eval:retrieval  # needs local Supabase + `pnpm tsx scripts/mock-ingest.ts --rebase-dates`
pnpm eval:redteam
pnpm eval:view
```

What each suite measures, design choices and the latest results: [docs/evals.md](../docs/evals.md).
