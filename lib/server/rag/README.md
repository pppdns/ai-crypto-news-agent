# RAG Module

This directory contains the complete Retrieval-Augmented Generation (RAG) pipeline implementation for the AI Crypto News Agent.

## Module Structure

```
lib/server/rag/
├── types.ts                  # TypeScript interfaces
├── temporal-detection.ts     # Time keyword detection
├── hybrid-search.ts          # Vector + FTS retrieval
├── reranker.ts               # LLM-based re-ranking
├── citations.ts              # Citation parsing & enrichment
├── prompts.ts                # LLM prompts
├── workflow.ts               # Sequential pipeline orchestration
└── README.md                 # This file
```

## Quick Start

### Basic Usage

```typescript
import { executeRAGWorkflow } from '@/lib/server/rag/workflow';

// Execute complete RAG pipeline
const result = await executeRAGWorkflow('What happened with Bitcoin today?');

// Access results
console.log(result.answer); // Generated answer
console.log(result.citations); // Enriched citations
console.log(result.error); // Error message (if any)
```

### Advanced Usage

#### 1. Temporal Detection

```typescript
import { detectTemporalWindow } from './temporal-detection';

const temporal = detectTemporalWindow('What happened today?');
// Returns: { days: 1, detected: true, keyword: 'today' }
```

#### 2. Hybrid Search

```typescript
import { generateEmbedding } from '../embeddings';
import { hybridSearch } from './hybrid-search';

const embedding = await generateEmbedding(query);
const candidates = await hybridSearch({
  queryEmbedding: embedding,
  query: query,
  temporalWindowDays: 7,
  limit: 40,
});
// Returns: Chunk[] (top 40 candidates)
```

#### 3. Re-ranking

```typescript
import { rerankChunks } from './reranker';

const topChunks = await rerankChunks(query, candidates, 8);
// Returns: Chunk[] (top 8 re-ranked chunks)
```

#### 4. Citation Parsing

```typescript
import { parseCitations } from './citations';

const { text, citations } = await parseCitations(llmResponse);
// Returns: { text: string, citations: Citation[] }
```

## Module Details

### types.ts

Core TypeScript interfaces used throughout the pipeline.

**Key Types**:

- `RAGState`: Sequential pipeline state
- `Chunk`: Article chunk with metadata
- `Citation`: UI-ready citation format
- `TemporalWindow`: Recency filtering config

### temporal-detection.ts

Detects time-related keywords and maps them to recency windows.

**Supported Keywords**:

- "today" → 1 day
- "yesterday" → 2 days
- "latest" → 3 days
- "this week" → 7 days
- "recent" → 14 days
- "this month" → 30 days

**Default**: 21 days (no keyword)

### hybrid-search.ts

Combines vector similarity and full-text search.

**Algorithm**:

1. Vector search (cosine similarity)
2. FTS search (PostgreSQL tsvector)
3. Normalize both scores to 0-1
4. Weighted blend: 70% vector + 30% FTS
5. Apply recency decay (10% per week)

**Parameters**:

- `queryEmbedding`: 1536-dim vector
- `query`: Original text
- `temporalWindowDays`: Days to filter
- `limit`: Result count (default: 40)

**Returns**: Top candidates with scores

### reranker.ts

Uses LLM to score chunk relevance.

**Process**:

1. Send each chunk to `gpt-4o-mini` with query
2. LLM scores 1-10
3. Sort by scores
4. Return top K

**Benefits**:

- More accurate than hybrid scoring alone
- Considers full query semantics
- Falls back to hybrid scores on error

**Cost**: ~$0.001 per query (40 chunks × $0.000025)

### citations.ts

Extracts and enriches citations from LLM responses.

**Features**:

- Regex-based article ID extraction
- Database metadata lookup
- Relative date formatting
- URL-based deduplication

**Citation Format**:

```typescript
{
  url: string,
  title: string,
  sourceName: string,
  relativeDate: string,  // "2 days ago"
  articleId: string
}
```

### prompts.ts

System prompts for LLM operations.

**Answer Generation Prompt**:

- Strict grounding rules
- Citation format specification
- "No recent news" fallback
- Hallucination prevention

**Re-ranking Prompt**:

- Clear scoring criteria (1-10)
- Relevance assessment
- Deterministic output (temperature=0)

### workflow.ts

Sequential pipeline orchestration of the entire RAG flow.

**Pipeline Nodes**:

1. `detectTemporal` - Temporal window detection
2. `generateEmbedding` - Query embedding
3. `hybridSearch` - Candidate retrieval
4. `rerank` - LLM re-ranking
5. `generateAnswer` - Answer generation
6. `enrichCitations` - Citation enrichment

**Execution**:

```typescript
// Sequential execution through all nodes
const result = await executeRAGWorkflow(query);
```

**Architecture**: Simple sequential flow with manual state passing between nodes

**Error Handling**: Each node catches errors and sets `error` in state. If error is set, pipeline aborts immediately.

**Benefits**:

- Full TypeScript type safety
- Easy to debug and trace
- No external orchestration dependencies
- Explicit state transitions

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...              # Required
SUPABASE_URL=https://...           # Required
SUPABASE_SERVICE_ROLE_KEY=...      # Required
```

### Tuning Parameters

**Hybrid Search** (`hybrid-search.ts`):

```typescript
const limit = 40; // Candidate count
const match_threshold = 0.3; // Similarity threshold
```

**Re-ranking** (`reranker.ts`):

```typescript
const topK = 8; // Final chunk count
const model = 'gpt-4o-mini'; // LLM model
```

**Temporal Detection** (`temporal-detection.ts`):

```typescript
const DEFAULT_WINDOW_DAYS = 21; // Default recency
```

## Performance

### Typical Latency

| Operation           | Time      |
| ------------------- | --------- |
| Temporal Detection  | <10ms     |
| Generate Embedding  | 50-150ms  |
| Hybrid Search       | 100-300ms |
| Re-ranking (40→8)   | 2-5s      |
| Answer Generation   | 3-8s      |
| Citation Enrichment | 50-100ms  |
| **Total**           | **6-14s** |

### Optimization Tips

1. **Reduce Re-ranking Time**:
   - Use local cross-encoder instead of LLM
   - Lower candidate count (40→20)
   - Batch LLM calls more efficiently

2. **Reduce Search Time**:
   - Tune pgvector index parameters
   - Use materialized views for common queries
   - Add caching layer

3. **Reduce Embedding Time**:
   - Use smaller embedding model
   - Batch multiple queries
   - Cache embeddings for common queries

## Testing

### Unit Tests

Test individual functions:

```typescript
// Test temporal detection
const result = detectTemporalWindow("today's news");
expect(result.days).toBe(1);

// Test citation parsing
const { citations } = await parseCitations(textWithCitations);
expect(citations.length).toBeGreaterThan(0);
```

### Integration Tests

Test full workflow:

```typescript
const result = await executeRAGWorkflow('What happened with Bitcoin?');
expect(result.answer).toBeDefined();
expect(result.error).toBeNull();
```

### Manual Testing

Use these test queries:

- "What happened with Bitcoin today?" (temporal)
- "Tell me about Solana ETF" (specific)
- "Recent crypto news" (broad)

## Error Handling

Each module handles errors gracefully:

- **Temporal Detection**: Falls back to default (21 days)
- **Hybrid Search**: Returns empty array, triggers "No recent news"
- **Re-ranking**: Falls back to hybrid scores
- **Answer Generation**: Returns error message
- **Citation Parsing**: Returns empty citations array

## Dependencies

### Internal

- `../embeddings.ts` - OpenAI embedding generation
- `../supabase.ts` - Database client

### External

- `openai@6.7.0` - LLM and embeddings
- `@supabase/supabase-js@2.76.1` - Database

**Note**: Originally designed to use `@langchain/langgraph`, but implemented as a sequential pipeline for better TypeScript compatibility and simpler maintenance.

## Common Issues

### "No candidates found"

**Cause**: Hybrid search returned 0 results  
**Fix**: Lower `match_threshold` or increase `temporalWindowDays`

### "Re-ranking takes too long"

**Cause**: 40 parallel LLM calls  
**Fix**: Reduce candidate count or skip re-ranking

### "Citations not enriched"

**Cause**: Article IDs not in database  
**Fix**: Verify articles exist, check ID extraction regex

## Best Practices

1. **Always check `error` field** in workflow result
2. **Log each stage** for debugging
3. **Handle "No recent news" case** in UI
4. **Cache query embeddings** for repeated queries
5. **Monitor LLM costs** (re-ranking can be expensive)
6. **Validate citations** before display

## Extending the Pipeline

### Adding a New Node

**Step 1**: Define your node function in `workflow.ts`:

```typescript
/**
 * Node: Your custom processing step
 */
async function myNewNode(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log('Executing my custom node...');

    // Your logic here
    const result = await processData(state);

    return {
      // Return state updates
      myNewField: result,
    };
  } catch (error) {
    console.error('Error in myNewNode:', error);
    return {
      error: 'Failed to execute custom node',
    };
  }
}
```

**Step 2**: Add your node to the sequential pipeline in `executeWorkflowSteps()`:

```typescript
async function executeWorkflowSteps(initialState: RAGState): Promise<RAGState> {
  let state = { ...initialState };

  // ... existing nodes ...

  // Add your node in the appropriate position
  const myResult = await myNewNode(state);
  state = { ...state, ...myResult };
  if (state.error) return state;

  // ... continue with remaining nodes ...

  return state;
}
```

**Step 3**: Update the `RAGState` interface in `types.ts` if needed:

```typescript
export interface RAGState {
  // ... existing fields ...
  myNewField?: MyCustomType;
}
```

### Adding New Temporal Keywords

Edit `temporal-detection.ts`:

```typescript
const TEMPORAL_PATTERNS = [
  // ... existing patterns
  { pattern: /\b(last hour)\b/i, days: 0.04, keyword: 'last hour' },
];
```

### Changing Re-ranking Model

Edit `reranker.ts`:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o', // Change here
  // ...
});
```

## Documentation

- **Comprehensive Guide**: `../../../docs/rag-pipeline.md`
- **Implementation Summary**: `./IMPLEMENTATION_SUMMARY.md`
- **Ingestion Docs**: `../../../docs/ingestion-pipeline.md`

## Support

For issues or questions:

1. Check module-specific error messages
2. Review console logs
3. Consult `docs/rag-pipeline.md`
4. Test stages individually
