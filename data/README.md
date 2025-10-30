# Mock Data for Testing

This directory contains mock crypto news articles for testing the ingestion, embedding, and loading pipeline without scraping external websites.

## Files

- **`mock-articles.ts`**: TypeScript file containing mock news sources and articles

## Data Structure

### Mock Sources (3 sources)

- Cointelegraph
- CryptoPotato
- NewsBTC

### Mock Articles (36 articles)

The mock data includes 36 realistic crypto news articles covering various topics:

1. **Solana ETF** - VanEck submission to SEC (Oct 27)
2. **Bitcoin ATH** - Bitcoin reaches $95,000 (Oct 26)
3. **Ethereum Merge Anniversary** - One year post-merge statistics (Oct 25)
4. **Ethereum ETF** - SEC approval for spot ETH ETFs (Oct 24)
5. **Ripple XRP** - Bank integration announcement (Oct 23)
6. **DeFi TVL** - $200B milestone reached (Oct 22)
7. **Cardano Hydra** - Scaling solution mainnet launch (Oct 21)
8. **SEC Enforcement** - Exchange charged with violations (Oct 20)
9. **Polygon zkEVM** - Network upgrade (Oct 19)
10. **Bitcoin Mining** - 60% renewable energy milestone (Oct 18)
11. **Fed CBDC** - Digital dollar pilot program (Oct 17)
12. **Avalanche Subnets** - Financial institution deployment (Oct 16)
13. **NFT Market** - 150% volume surge (Oct 15)
14. **Chainlink** - 100+ TradFi integrations (Oct 14)
15. **Base Network** - $5B TVL milestone (Oct 13)
16. **opBNB Launch** - Binance layer-2 solution (Oct 12)
17. **Uniswap V4** - Hooks and enhanced liquidity (Oct 11)
18. **Tether Transparency** - $3.2B excess reserves revealed (Oct 10)
19. **Polkadot Parachains** - 50th parachain launches (Oct 9)
20. **Grayscale GBTC** - Conversion to spot ETF (Oct 8)
21. **Arbitrum Gaming** - Immutable partnership (Oct 7)
22. **PayPal PYUSD** - Expansion to Solana (Oct 6)
23. **Aave V4** - Real-world assets support (Oct 5)
24. **Cosmos Interchain Security** - 20 consumer chains (Oct 4)
25. **Ethereum Proto-Danksharding** - 90% fee reduction (Oct 3)
26. **Circle CCTP** - Cross-chain USDC transfers (Oct 2)
27. **MakerDAO Rebrand** - Sky and USDS launch (Oct 1)
28. **Sui Network** - 100M daily transactions (Sep 30)
29. **BlackRock BUIDL** - $1B in tokenized treasuries (Sep 29)
30. **Aptos Upgrade** - 200% performance boost (Sep 28)
31. **Lightning Network** - 6,000 BTC capacity (Sep 27)
32. **MetaMask Snaps** - 10M plugin installs (Sep 26)
33. **Compound V3** - 10 blockchain networks (Sep 25)
34. **Bitcoin Ordinals** - $2B in NFT volume (Sep 24)
35. **StarkNet Staking** - 10% APY launch (Sep 23)
36. **Ethereum Name Service** - 3M .eth domains (Sep 22)

Each article includes:

- Realistic multi-paragraph text summaries (300-500 words)
- Recent publication dates (September 22 - October 27, 2025)
- Author names
- Source attribution
- Varied crypto topics for testing retrieval diversity

## Usage

### Import the mock data

```typescript
import { mockArticles, mockSources } from '@/data/mock-articles';
```

### Use in your ingestion pipeline

```typescript
// Example: Load mock articles instead of scraping
for (const source of mockSources) {
  // Insert or get source from database
  const sourceId = await insertSource(source);

  const articlesForSource = mockArticles.filter((article) => article.source_name === source.name);

  for (const article of articlesForSource) {
    // Process article (same as real ingestion)
    await processArticle({
      ...article,
      source_id: sourceId,
      fetched_at: new Date().toISOString(),
    });
  }
}
```

### Testing specific scenarios

```typescript
import { getMockArticlesByDateRange, getMockArticlesBySource, searchMockArticles } from '@/data/mock-articles';

// Test recency filtering (last 7 days of October)
const recentArticles = getMockArticlesByDateRange(new Date('2025-10-21'), new Date('2025-10-27'));

// Test source-specific retrieval
const cointelegraphArticles = getMockArticlesBySource('Cointelegraph');

// Test keyword search
const solanaArticles = searchMockArticles('Solana');
const ethereumArticles = searchMockArticles('Ethereum');
```

## Testing the Full Pipeline

Use this mock data to test:

1. **Article insertion** - Verify deduplication by URL hash
2. **Chunking** - Test paragraph-based chunking with overlap
3. **Embedding generation** - Generate embeddings for all chunks
4. **Hybrid search** - Test vector + FTS retrieval
5. **Recency filtering** - Query by date ranges
6. **Re-ranking** - Test LLM-based chunk scoring
7. **Answer generation** - Generate answers with citations

## Example Test Queries

Once the mock data is loaded, test with these queries:

- "What happened with the Solana ETF this week?"
- "Tell me about Bitcoin's recent price movement"
- "What's new with Ethereum?"
- "Has the SEC taken any enforcement actions recently?"
- "What are the latest developments in DeFi?"
- "Tell me about layer 2 scaling solutions"
- "What's happening with institutional crypto adoption?"
- "What's the latest with Uniswap?"
- "Tell me about stablecoin developments"
- "What's happening with NFTs and Bitcoin Ordinals?"
- "How is Polkadot's parachain ecosystem doing?"
- "What are the recent gaming and Web3 developments?"
- "Tell me about real-world asset tokenization"
- "What's new with Lightning Network?"

## Benefits of Using Mock Data

✅ **No external dependencies** - Test without API keys or network requests  
✅ **Consistent results** - Same data every time for reproducible tests  
✅ **Fast iteration** - No waiting for web scraping or API calls  
✅ **Cost-free** - No usage charges for external services  
✅ **Offline development** - Work without internet connection  
✅ **Known ground truth** - Verify retrieval accuracy against known content

## Next Steps

After testing with mock data:

1. ✅ Verify the ingestion script works with this data
2. ✅ Confirm embeddings are generated correctly
3. ✅ Test hybrid search returns relevant results
4. ✅ Validate re-ranking improves relevance
5. ✅ Check answer generation cites sources properly
6. ✅ **Production Ready**: Use `scripts/crawl-news.ts` for real RSS feed ingestion

## Production Ingestion

For real-time news crawling, use the production crawler:

```bash
npx tsx scripts/crawl-news.ts
```

The crawler:

- Parses RSS feeds from Cointelegraph, CryptoPotato, and NewsBTC
- Scrapes articles with Firecrawl
- Supports incremental ingestion (only processes new articles)
- Handles RSS 2.0 and Atom feeds
- Includes User-Agent headers to avoid 403 errors
- See `docs/crawler.md` for complete documentation
