import { Citations } from './citations';

const mockCitations = [
  {
    url: 'https://cointelegraph.com/news/sec-binance-lawsuit-update',
    title: 'SEC vs Binance: Latest Developments in Major Crypto Lawsuit',
    sourceName: 'Cointelegraph',
    relativeDate: '2 days ago',
  },
  {
    url: 'https://cryptopotato.com/binance-sec-case-analysis',
    title: 'How Binance-SEC Lawsuit Impacts Bitcoin Price Action',
    sourceName: 'CryptoPotato',
    relativeDate: '3 days ago',
  },
  {
    url: 'https://newsbtc.com/bitcoin-sec-binance-correlation',
    title: 'Bitcoin Reacts to SEC Enforcement Actions Against Major Exchanges',
    sourceName: 'NewsBTC',
    relativeDate: '5 days ago',
  },
  {
    url: 'https://cointelegraph.com/news/regulatory-impact-crypto-markets',
    title: 'Regulatory Uncertainty Continues to Shape Crypto Market Sentiment',
    sourceName: 'Cointelegraph',
    relativeDate: '1 week ago',
  },
];

export const assistantMessage = (
  <div>
    <p className="mb-9 font-bold">
      The SEC vs Binance lawsuit has had a significant impact on the price of Bitcoin. The lawsuit has been ongoing for
      several months and has been a major topic of discussion in the crypto community. The SEC vs Binance lawsuit has
      had a significant impact on the price of Bitcoin. The lawsuit has been ongoing for several months and has been a
      major topic of discussion in the crypto community.
    </p>

    <Citations citations={mockCitations} />
  </div>
);

export const userMessage = 'How did the latest news on the SEC vs Binance lawsuit affect the price of Bitcoin?';
