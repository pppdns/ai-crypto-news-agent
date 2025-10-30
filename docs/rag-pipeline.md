# RAG Pipeline Documentation

## Overview

The AI Crypto News Agent uses a sophisticated Retrieval-Augmented Generation (RAG) pipeline to answer user questions about cryptocurrency news. The pipeline combines vector similarity search, full-text search (FTS), LLM-based re-ranking, and grounded answer generation with citation tracking.

## Architecture

### High-Level Flow

```
User Query
    ↓
┌──────────────────────────────────────────────┐
│     LangGraph RAG Pipeline Workflow          │
├──────────────────────────────────────────────┤
│ 1. Temporal Detection                        │
│    └─→ Extract time context (days)           │
│                                              │
│ 2. Query Embedding                           │
│    └─→ Generate 1536-dim vector              │
│                                              │
│ 3. Hybrid Search                             │
│    ├─→ Vector similarity (70%)               │
│    ├─→ Full-text search (30%)                │
│    └─→ Return top 40 candidates              │
│                                              │
│ 4. Conditional Routing (LangGraph)           │
│    ├─→ < 10 candidates: Skip rerank          │
│    └─→ ≥ 10 candidates: LLM rerank           │
│                                              │
│ 5. Re-ranking (Conditional)                  │
│    ├─→ LLM scores each chunk (1-10)          │
│    └─→ Return top 8 chunks                   │
│                                              │
│ 6. Answer Generation (gpt-5)                 │
│    ├─→ Prompt LLM with context               │
│    ├─→ Stream tokens to UI                   │
│    └─→ Include citation markers              │
│                                              │
│ 7. Citation Enrichment                       │
│    ├─→ Extract article IDs                   │
│    ├─→ Fetch metadata from DB                │
│    └─→ Return enriched citations             │
└──────────────────────────────────────────────┘
    ↓
Streaming Response + Citations
```

## Pipeline Stages

### 1. Temporal Detection

**Purpose**: Determine the recency window for filtering articles based on time-related keywords in the query.

**Location**: `lib/server/rag/temporal-detection.ts`

**Process**:

- Scans query for temporal keywords (e.g., "today", "this week", "latest")
- Maps keywords to day windows:
  - "today" → 1 day
  - "yesterday" → 2 days
  - "latest" → 3 days
  - "this week" → 7 days
  - "recent" → 14 days
  - "this month" → 30 days
  - Default → 21 days (no keyword detected)

**Output**: Number of days for recency filtering

**Example**:

```typescript
detectTemporalWindow('What happened with Bitcoin today?');
// Returns: { days: 1, detected: true, keyword: 'today' }
```

### 2. Query Embedding

**Purpose**: Convert user query into a dense vector for semantic similarity search.

**Location**: `lib/server/embeddings.ts`

**Process**:

- Uses OpenAI `text-embedding-3-large` model
- Generates 1536-dimensional embedding
- L2-normalizes the vector for cosine similarity

**Output**: Normalized 1536-dim embedding vector

**Configuration**:

- Model: `text-embedding-3-large`
- Dimensions: 1536 (reduced from 3072 for pgvector 0.8.0 HNSW compatibility)
- Quality retention: ~95% of full model quality

### 3. Hybrid Search

**Purpose**: Retrieve relevant article chunks by combining semantic and keyword search.

**Location**:

- TypeScript: `lib/server/rag/hybrid-search.ts`
- SQL Function: `supabase/migrations/0003_hybrid_search_function.sql`

**Process**:

1. **Vector Search**: Finds semantically similar chunks using cosine distance
2. **FTS Search**: Finds keyword matches using PostgreSQL full-text search
3. **Score Combination**: Weighted hybrid score = 70% vector + 30% FTS
4. **Recency Decay**: Gentle 10% decay per 7 days to prefer recent content
5. **Normalization**: Both scores normalized to 0-1 before combining

**Parameters**:

- `query_embedding`: 1536-dim vector
- `query_text`: Original query string
- `match_threshold`: Minimum similarity (default: 0.3)
- `match_count`: Number of results (default: 40)
- `cutoff_date`: Earliest article date based on temporal window

**Output**: Top 40 candidate chunks with:

- Article metadata (title, source, date, URL)
- Chunk content
- Hybrid score

**SQL Implementation**:

```sql
-- Normalized blend: 70% vector + 30% FTS with recency decay
(0.7 * norm_similarity + 0.3 * norm_fts) *
(1.0 - (age_in_weeks * 0.1)) AS hybrid_score
```

### 4. Re-ranking

**Purpose**: Use LLM to score chunk relevance and select the most pertinent results.

**Location**: `lib/server/rag/reranker.ts`

**Process**:

1. For each of the 40 candidates, send to LLM with query
2. LLM scores relevance on 1-10 scale
3. Sort by LLM scores
4. Return top 8 chunks

**Model**: `gpt-4o-mini` (fast and cost-effective)

**Prompt Template**:

```
Score the relevance of this article chunk to the user's query on a scale of 1-10.
Query: {query}
Chunk: {chunk content}
Respond with ONLY a number between 1 and 10.
```

**Error Handling**: Falls back to original hybrid scores if LLM scoring fails

**Output**: Top 8 most relevant chunks

### 5. Answer Generation

**Purpose**: Generate a grounded, cited answer using only retrieved context.

**Location**: `lib/server/rag/workflow.ts` (generateAnswerNode)

**Process**:

1. Format top 8 chunks into context with article IDs
2. Send to LLM with strict grounding instructions
3. Stream response tokens to UI in real-time
4. LLM includes citation markers: `[Article ID: <uuid>]`

**Model**: `gpt-5`

**System Prompt Rules**:

1. Only use provided context
2. Cite every claim immediately with article ID
3. Respond "No recent news" if insufficient context
4. No hallucination or fabrication
5. Decline offensive requests

**Streaming**: Uses Vercel AI SDK `streamText` for progressive token delivery

**Output**: Streaming answer text with inline citation markers

### 6. Citation Enrichment

**Purpose**: Extract article IDs from LLM response and enrich with full metadata.

**Location**: `lib/server/rag/citations.ts`

**Process**:

1. **Extract IDs**: Parse citation markers using regex patterns
2. **Fetch Metadata**: Query database for article details
3. **Deduplicate**: Use URL as key to prevent duplicate citations
4. **Format Dates**: Convert timestamps to relative dates (e.g., "2 days ago")
5. **Build Citations**: Create Citation objects for UI display

**Citation Format**:

```typescript
interface Citation {
  url: string; // Link to original article
  title: string; // Article title
  sourceName: string; // Publisher name (e.g., "Cointelegraph")
  relativeDate: string; // Formatted date (e.g., "3 days ago")
  articleId: string; // UUID for tracking
}
```

**Output**: Array of enriched citations sent to frontend

## Data Flow

### Request Flow

```
POST /ask
  ↓
Read user question
  ↓
executeRAGWorkflow(query)
  ↓
┌─────────────────────────────┐
│ LangGraph State Machine     │
├─────────────────────────────┤
│ State {                     │
│   query: string             │
│   temporalWindow: number    │
│   queryEmbedding: number[]  │
│   candidates: Chunk[]       │
│   rerankedChunks: Chunk[]   │
│   answer: string            │
│   citations: Citation[]     │
│   error: string | null      │
│ }                           │
└─────────────────────────────┘
  ↓
Stream answer tokens
  ↓
Parse & enrich citations
  ↓
Send citations as final data
  ↓
Response to client
```

### Database Queries

**Hybrid Search SQL**:

```sql
SELECT
  chunk_id, article_id, content, title,
  source_name, published_at, url,
  (0.7 * norm_similarity + 0.3 * norm_fts) * recency_factor AS score
FROM (
  -- Vector similarity search
  -- + Full-text search
  -- Combined and normalized
)
WHERE published_at >= cutoff_date
ORDER BY score DESC
LIMIT 40
```

**Citation Metadata Fetch**:

```sql
SELECT
  articles.id, title, url, published_at,
  sources.name AS source_name
FROM articles
JOIN sources ON articles.source_id = sources.id
WHERE articles.id IN (extracted_article_ids)
```

## Technology Stack

### LangGraph Orchestration

**Implementation**: LangGraph 1.0.1 StateGraph with conditional routing

**State Management**: LangGraph Annotation API with type-safe `RAGState` interface

**Nodes**:

- `detectTemporal`: Temporal window detection
- `generateEmbedding`: Query embedding generation
- `hybridSearch`: Hybrid retrieval
- `skipRerank`: Pass-through node when < 10 candidates
- `rerank`: LLM re-ranking (conditionally executed)
- `generateAnswer`: Answer generation
- `enrichCitations`: Citation enrichment

**Execution**: StateGraph with conditional routing based on candidate count

**Conditional Routing**:

- After `hybridSearch`, routes to:
  - `END` if error or no candidates
  - `skipRerank` if < 10 candidates (cost optimization)
  - `rerank` if ≥ 10 candidates (full LLM scoring)
- Both `skipRerank` and `rerank` converge at `generateAnswer`

**Benefits**:

- Intelligent cost/latency optimization via conditional routing
- Type-safe state management with Annotation API
- Declarative workflow definition
- Built-in error handling and state transitions
- Explicit control flow with visual graph structure

### Vector Database

**pgvector 0.8.0** with HNSW index:

- Index type: `hnsw (vector_cosine_ops)`
- Parameters: `m=16, ef_construction=64`
- Query recall: ~97-99%
- Dimension limit: 2000 (hence 1536-dim embeddings)

### Streaming

**Vercel AI SDK v5**:

- `streamText()` for token streaming
- `TransformStream` for custom data injection
- Server-sent events (SSE) protocol
- Client-side `useChat()` hook

## Performance Characteristics

### Latency Breakdown (Typical Query)

| Stage               | Time      | Notes                       |
| ------------------- | --------- | --------------------------- |
| Temporal Detection  | <10ms     | Regex pattern matching      |
| Query Embedding     | 50-150ms  | OpenAI API call             |
| Hybrid Search       | 100-300ms | Postgres vector + FTS query |
| Re-ranking (40→8)   | 2-5s      | 40 parallel LLM calls       |
| Answer Generation   | 3-8s      | Streaming LLM response      |
| Citation Enrichment | 50-100ms  | Database metadata fetch     |
| **Total**           | **6-14s** | Most time in LLM operations |

### Optimization Opportunities

1. **Re-ranking**: Could use local cross-encoder for 10x speedup
2. **Embedding**: Batch multiple queries in parallel requests
3. **Caching**: Cache query embeddings for repeated queries
4. **Parallel**: Run embedding + temporal detection in parallel

### Model Settings

**Embedding**:

- Model: `text-embedding-3-large`
- Dimensions: 1536
- Cost: ~$0.13 per 1M tokens

**Re-ranking**:

- Model: `gpt-4o-mini`
- Temperature: 0 (deterministic)
- Max tokens: 10

**Answer Generation**:

- Model: `gpt-5`
- Temperature: 0.3 (slightly creative)
- Max tokens: 1000

### Retrieval Parameters

```typescript
const HYBRID_SEARCH_PARAMS = {
  candidateCount: 40, // Initial retrieval
  minSimilarity: 0.3, // Similarity threshold
  vectorWeight: 0.7, // Vector search weight
  ftsWeight: 0.3, // FTS weight
  recencyDecay: 0.1, // 10% per week
};

const RERANK_PARAMS = {
  topK: 8, // Final chunks for context
  model: 'gpt-4o-mini',
};
```

## Error Handling

### Graceful Degradation

1. **No Embedding**: Return error, cannot proceed
2. **Hybrid Search Fails**: Return "No recent news"
3. **Re-ranking Fails**: Use original hybrid scores
4. **LLM Generation Fails**: Return generic error message
5. **Citation Parsing Fails**: Return answer without citations

### Error Response Format

```json
{
  "error": "Failed to process query",
  "message": "Detailed error description"
}
```

## Frontend Integration

### Chat Component

**Location**: `components/chat/prompt-container-with-conversation.tsx`

**Architecture**: Single-turn conversation (one question, one answer at a time)

**Flow**:

1. User submits question via input or suggestion button
2. Component sends POST request to `/ask` endpoint with `{ query: string }`
3. Previous question, answer, and citations are cleared immediately
4. Receives streaming text response token by token
5. Updates assistant answer state progressively during streaming
6. Extracts citations from final data event
7. Displays complete answer with citations

**State Management**:

```typescript
const [userQuestion, setUserQuestion] = useState('');
const [assistantAnswer, setAssistantAnswer] = useState('');
const [citations, setCitations] = useState<Citation[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

**API Request Format**:

```typescript
fetch('/ask', {
  method: 'POST',
  body: JSON.stringify({ query: userQuestion }),
});
```

**Citation Display**:

```tsx
<Citations citations={citations} />
```

Each citation shows:

- Clickable article title
- Source name
- Relative publish date
- External link icon

### Data Format

**Request Body**:

```json
{
  "query": "What happened with Bitcoin today?"
}
```

**Streaming Response**:

```
Bitcoin recently...
 reached new highs
data: {"type":"citations","citations":[{...}]}
```

**Citation Extraction**:

```typescript
// Parse streaming data
if (line.startsWith('data: ')) {
  const parsed = JSON.parse(line.slice(6));
  if (parsed.type === 'citations') {
    setCitations(parsed.citations);
  }
}
```

## Testing

### Manual Testing Queries

**Temporal Queries**:

- "What happened with Bitcoin today?"
- "Tell me about Ethereum this week"
- "Recent Solana news"

**Specific Queries**:

- "Is there a Solana ETF?"
- "What did the SEC announce about crypto?"
- "Bitcoin price predictions"

**Edge Cases**:

- Very broad queries with no temporal context
- Queries about very old events (should return "No recent news")
- Offensive or inappropriate queries (should be declined)

### Expected Behavior

✅ **Success**: Grounded answer with 2-5 citations  
✅ **No Results**: "No recent news" message  
✅ **Streaming**: Tokens appear progressively  
✅ **Citations**: Accurate links with metadata  
❌ **Hallucination**: Should never happen (strict prompting)

## Monitoring & Observability

### Logging

Each stage logs to console:

```
Processing query: "What happened with Bitcoin today?"
Detecting temporal window...
Temporal window: 1 days (keyword: today)
Generating query embedding...
Embedding generated (1536 dimensions)
Executing hybrid search...
Found 40 candidate chunks
Re-ranking candidates...
Re-ranking complete: 8 top chunks
Generating answer...
Answer generated
Parsing and enriching citations...
Found 3 citations
```

### Metrics to Track

- Query latency (total and per-stage)
- Hybrid search result counts
- Re-ranking score distributions
- Citation counts per response
- "No recent news" frequency
- Error rates by stage

## Maintenance

### Database Maintenance

**VACUUM after bulk writes**:

```sql
VACUUM (ANALYZE) article_chunks;
VACUUM (ANALYZE) articles;
```

**Index health check**:

```sql
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

### Model Updates

When upgrading models:

1. Update model names in code
2. Test with sample queries
3. Monitor latency changes
4. Adjust temperature/tokens if needed

## Future Enhancements

- [ ] Replace OpenAI re-ranker with local cross-encoder
- [ ] Add query classification for better recency filtering
- [ ] Add multi-turn conversation support
- [ ] Implement query expansion/rewriting
- [ ] Add fact-checking layer
- [ ] Support non-English queries

## Troubleshooting

### Common Issues

**Issue**: "No recent news" for queries that should have results  
**Solution**: Check temporal window detection, verify articles in DB, lower similarity threshold

**Issue**: Slow re-ranking (>10s)  
**Solution**: Reduce candidate count from 40 to 20, or skip re-ranking for simple queries

**Issue**: Citations not appearing  
**Solution**: Check citation parsing regex, verify article IDs in database, check frontend data extraction

**Issue**: Hallucinated information in answers  
**Solution**: Review system prompt, ensure context is being passed correctly, check for model temperature

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
