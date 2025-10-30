-- Add new crypto news sources: 99Bitcoins, Crypto Briefing, and ZyCrypto
-- This migration adds 3 new RSS feed sources to the sources table

INSERT INTO sources (id, name, homepage_url, rss_url) VALUES
  (
    'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
    '99Bitcoins',
    'https://99bitcoins.com',
    'https://99bitcoins.com/feed/'
  ),
  (
    'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
    'Crypto Briefing',
    'https://cryptobriefing.com',
    'https://cryptobriefing.com/feed/'
  ),
  (
    'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
    'ZyCrypto',
    'https://zycrypto.com',
    'https://zycrypto.com/feed/'
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE sources IS 'Crypto news RSS feed sources - now includes 6 sources: Cointelegraph, CryptoPotato, NewsBTC, 99Bitcoins, Crypto Briefing, and ZyCrypto';

