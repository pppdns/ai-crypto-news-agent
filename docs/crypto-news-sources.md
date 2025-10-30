# Crypto News Data Sources

The system ingests real-time cryptocurrency news from multiple RSS feed sources every 15 minutes.

## Real Data Sources

The system ingests news from the following 6 cryptocurrency news publishers:

### Active RSS Feed Sources

| Source          | Homepage                   | RSS Feed URL                     | Coverage                              |
| --------------- | -------------------------- | -------------------------------- | ------------------------------------- |
| Cointelegraph   | https://cointelegraph.com  | https://cointelegraph.com/rss    | General crypto news, market analysis  |
| CryptoPotato    | https://cryptopotato.com   | https://cryptopotato.com/feed    | Breaking news, price analysis         |
| NewsBTC         | https://www.newsbtc.com    | https://www.newsbtc.com/feed     | Bitcoin & altcoin news                |
| 99Bitcoins      | https://99bitcoins.com     | https://99bitcoins.com/feed/     | Educational content, guides, reviews  |
| Crypto Briefing | https://cryptobriefing.com | https://cryptobriefing.com/feed/ | In-depth analysis, institutional news |
| ZyCrypto        | https://zycrypto.com       | https://zycrypto.com/feed/       | Fast-paced news, blockchain tech      |

### Source Details

**Cointelegraph**

- Focus: Comprehensive crypto coverage with market analysis
- Format: RSS 2.0 (missing version attribute, handled by parser)

**CryptoPotato**

- Focus: Breaking news and price movements
- Format: RSS 2.0 with bot protection (requires User-Agent header)

**NewsBTC**

- Focus: Bitcoin-centric news and altcoin coverage
- Format: Standard RSS 2.0

**99Bitcoins**

- Focus: Educational content and beginner guides
- Format: Standard RSS 2.0

**Crypto Briefing**

- Focus: Professional analysis and institutional coverage
- Format: Standard RSS 2.0

**ZyCrypto**

- Focus: Fast-breaking news and blockchain technology
- Format: Standard RSS feed (may require User-Agent header)
