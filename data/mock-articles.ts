/**
 * Mock crypto news articles for testing the ingestion/embedding/loading pipeline
 * without scraping external websites.
 *
 * This data structure matches what would be returned from RSS + Firecrawl extraction.
 */

export interface MockSource {
  name: string;
  homepage_url: string;
  rss_url: string;
}

export interface MockArticle {
  source_name: string;
  url: string;
  title: string;
  author?: string;
  published_at: string; // ISO 8601 format
  text_summary: string; // Multi-paragraph summary that will be chunked
}

export const mockSources: MockSource[] = [
  {
    name: 'Cointelegraph',
    homepage_url: 'https://cointelegraph.com',
    rss_url: 'https://cointelegraph.com/rss',
  },
  {
    name: 'CryptoPotato',
    homepage_url: 'https://cryptopotato.com',
    rss_url: 'https://cryptopotato.com/feed',
  },
  {
    name: 'NewsBTC',
    homepage_url: 'https://www.newsbtc.com',
    rss_url: 'https://www.newsbtc.com/feed',
  },
];

export const mockArticles: MockArticle[] = [
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/solana-etf-application-submitted-sec',
    title: 'VanEck Submits First Solana ETF Application to SEC',
    author: 'Sarah Mitchell',
    published_at: '2025-10-27T14:30:00Z',
    text_summary: `Investment management firm VanEck has officially submitted the first Solana exchange-traded fund (ETF) application to the United States Securities and Exchange Commission (SEC). This landmark filing marks a significant milestone for the Solana ecosystem and the broader cryptocurrency ETF market.

The proposed Solana ETF would track the price of SOL, Solana's native cryptocurrency, providing institutional and retail investors with a regulated vehicle to gain exposure to the asset without directly holding it. VanEck, which already operates a Bitcoin ETF, cited Solana's robust blockchain infrastructure and growing adoption as key reasons for the filing.

Industry analysts suggest that the approval process could take several months, with the SEC requiring extensive documentation about Solana's market structure, liquidity, and custody solutions. The regulator has historically been cautious with cryptocurrency ETF applications, particularly for assets beyond Bitcoin and Ethereum.

Solana has experienced significant growth over the past year, with its blockchain processing millions of transactions daily and hosting a thriving ecosystem of decentralized applications. The network's high throughput and low transaction costs have attracted developers and users from various sectors, including decentralized finance (DeFi), non-fungible tokens (NFTs), and gaming.

Market participants have responded positively to the news, with SOL's price rising 8% in the hours following the announcement. Trading volume also surged significantly across major cryptocurrency exchanges. If approved, the Solana ETF could pave the way for additional altcoin ETFs and further legitimize the cryptocurrency sector in traditional financial markets.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/bitcoin-reaches-new-all-time-high-95000',
    title: 'Bitcoin Reaches New All-Time High Above $95,000 Amid Institutional Demand',
    author: 'James Peterson',
    published_at: '2025-10-26T09:15:00Z',
    text_summary: `Bitcoin (BTC) has shattered its previous all-time high, surging past $95,000 for the first time in history. The milestone comes amid unprecedented institutional demand and favorable regulatory developments in the United States and Europe.

The flagship cryptocurrency has gained over 25% in the past two weeks alone, driven by a perfect storm of positive catalysts. Major institutional investors, including pension funds and sovereign wealth funds, have significantly increased their Bitcoin allocations following the successful launch of multiple spot Bitcoin ETFs earlier this year.

On-chain data reveals that long-term holders continue to accumulate Bitcoin, with the supply held by addresses that haven't moved coins in over a year reaching record levels. This pattern typically signals strong conviction among experienced investors and reduces the available supply on exchanges, potentially leading to further price appreciation.

Several macroeconomic factors have also contributed to Bitcoin's rally. Concerns about inflation and currency devaluation in major economies have renewed interest in Bitcoin as a store of value and hedge against monetary instability. Additionally, recent statements from Federal Reserve officials suggesting a more accommodative monetary policy have boosted risk assets, including cryptocurrencies.

Technical analysts point to Bitcoin breaking through key resistance levels and establishing new support zones. Trading volume has been exceptionally high, indicating strong participation from both retail and institutional market participants. Some analysts project Bitcoin could reach $100,000 before the end of the year if current momentum continues.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/ethereum-merge-anniversary-network-statistics',
    title: 'Ethereum Celebrates One Year Since The Merge: Network Stats Reveal Major Progress',
    author: 'Michael Zhang',
    published_at: '2025-10-25T16:45:00Z',
    text_summary: `Ethereum is celebrating the first anniversary of The Merge, the historic transition from proof-of-work to proof-of-stake consensus mechanism. New data reveals the significant environmental and economic impact of this landmark upgrade on the world's second-largest blockchain network.

Since The Merge, Ethereum's energy consumption has decreased by approximately 99.95%, eliminating the need for energy-intensive mining operations. This dramatic reduction has positioned Ethereum as one of the most environmentally sustainable major blockchain networks, addressing one of the primary criticisms of cryptocurrency technology.

The network's tokenomics have also experienced notable changes post-Merge. Ethereum has become deflationary during periods of high network activity, with more ETH being burned through transaction fees than newly issued as staking rewards. This deflationary pressure has contributed to a more favorable supply-demand dynamic for ETH holders.

Staking participation has grown substantially, with over 28 million ETH now staked on the network, representing approximately 23% of the total supply. This high participation rate demonstrates strong confidence in Ethereum's long-term prospects and provides robust security for the network. The annual percentage yield for stakers has stabilized around 4-5%, offering a predictable return for participants.

Looking ahead, Ethereum developers are focusing on scalability improvements, including proto-danksharding and full danksharding implementations. These upgrades aim to significantly reduce transaction costs for layer-2 scaling solutions, further enhancing Ethereum's capacity to support mainstream applications and millions of users.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/sec-approves-spot-ethereum-etf-trading',
    title: 'SEC Approves Spot Ethereum ETF Trading, Market Reacts Positively',
    author: 'Emily Rodriguez',
    published_at: '2025-10-24T11:20:00Z',
    text_summary: `The United States Securities and Exchange Commission (SEC) has officially approved the trading of spot Ethereum exchange-traded funds (ETFs), marking a historic moment for the cryptocurrency industry. Multiple asset management firms, including BlackRock, Fidelity, and Grayscale, received approval to begin trading their Ethereum ETF products.

This approval comes after months of regulatory review and follows the successful launch of spot Bitcoin ETFs earlier this year. The SEC's decision reflects growing acceptance of cryptocurrencies in traditional financial markets and provides investors with additional regulated investment vehicles for gaining exposure to digital assets.

Trading for these spot Ethereum ETFs is expected to commence within the next few days, with significant anticipation from both institutional and retail investors. Analysts predict substantial inflows into these products, potentially exceeding the initial demand seen for Bitcoin ETFs due to Ethereum's broader use case beyond being a store of value.

Ethereum's unique position as a programmable blockchain platform that powers decentralized finance (DeFi), non-fungible tokens (NFTs), and various enterprise applications makes it attractive to a different investor demographic compared to Bitcoin. The ability to participate in Ethereum's ecosystem growth through a regulated, traditional brokerage account is expected to appeal to conservative investors.

Market reaction has been overwhelmingly positive, with ETH's price rising 12% following the announcement. Ethereum's market capitalization has increased by over $40 billion in a single day. Industry executives view this approval as validation of Ethereum's technology and its role in the evolving digital economy. Several firms have already announced plans to file for ETFs tracking other major cryptocurrencies.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/ripple-xrp-ledger-payment-integration-major-banks',
    title: 'Ripple Announces XRP Ledger Payment Integration with 50 Major Global Banks',
    author: 'David Chen',
    published_at: '2025-10-23T13:00:00Z',
    text_summary: `Ripple Labs has announced a groundbreaking partnership that will see 50 major global banks integrate the XRP Ledger for cross-border payment settlements. This massive adoption represents the largest institutional embrace of blockchain technology for international money transfers to date.

The participating banks, which include institutions from North America, Europe, Asia, and the Middle East, will leverage XRP as a bridge currency to facilitate faster and more cost-effective international transactions. Traditional cross-border payments typically take 3-5 business days and involve multiple intermediary banks, resulting in high fees and currency conversion costs.

Using the XRP Ledger, these banks will be able to settle international transactions in seconds rather than days, with transaction costs reduced by up to 60% compared to traditional correspondent banking systems. The technology enables real-time settlement without the need for pre-funded nostro accounts in different currencies, freeing up significant capital for banks.

Ripple's CEO emphasized that this integration demonstrates the practical utility of blockchain technology in solving real-world financial infrastructure challenges. The company has been working for years to build relationships with traditional financial institutions and navigate complex regulatory requirements across multiple jurisdictions.

The announcement has had an immediate impact on XRP's market performance, with the cryptocurrency surging 18% in value and trading volume increasing dramatically across all major exchanges. Blockchain analytics firms report significant increases in XRP Ledger activity, with transaction volumes reaching new all-time highs. Industry observers suggest this could be a inflection point for blockchain adoption in traditional finance.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/defi-total-value-locked-reaches-200-billion',
    title: 'DeFi Total Value Locked Surpasses $200 Billion Milestone',
    author: 'Lisa Wang',
    published_at: '2025-10-22T10:30:00Z',
    text_summary: `The decentralized finance (DeFi) sector has reached a significant milestone, with the total value locked (TVL) across all DeFi protocols surpassing $200 billion for the first time since early 2022. This achievement signals renewed confidence in decentralized financial applications and their ability to provide alternatives to traditional financial services.

The growth in TVL has been driven by multiple factors, including improved user experience, enhanced security measures following several high-profile incidents, and the introduction of innovative DeFi protocols offering compelling yield opportunities. Major protocols like Aave, Uniswap, and MakerDAO have all experienced substantial increases in deposits and user activity.

Ethereum continues to dominate the DeFi landscape, accounting for approximately 60% of the total TVL. However, alternative layer-1 blockchains and Ethereum layer-2 solutions have been gaining market share. Arbitrum, Optimism, and Base have all seen exponential growth in their DeFi ecosystems, offering users lower transaction costs while maintaining compatibility with Ethereum-based applications.

The real-world asset (RWA) tokenization trend has contributed significantly to DeFi's growth. Protocols enabling users to invest in tokenized Treasury bills, real estate, and other traditional assets have attracted billions in capital from both crypto-native users and traditional investors seeking yield in a regulated manner.

Institutional participation in DeFi has also increased markedly, with several hedge funds and asset managers now actively using DeFi protocols for yield generation and portfolio management. Regulatory clarity in key jurisdictions has made it easier for institutions to navigate the DeFi landscape while maintaining compliance with existing financial regulations.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/cardano-hydra-scaling-solution-mainnet-launch',
    title: "Cardano's Hydra Scaling Solution Launches on Mainnet, Promises 1 Million TPS",
    author: 'Robert Taylor',
    published_at: '2025-10-21T15:00:00Z',
    text_summary: `Cardano has officially launched its Hydra scaling solution on mainnet, introducing a layer-2 protocol designed to dramatically increase the blockchain's transaction throughput. The technology promises to enable up to one million transactions per second (TPS) through the use of state channels, positioning Cardano as one of the most scalable blockchain platforms.

Hydra operates by creating off-chain "heads" that allow groups of users to process transactions independently from the main Cardano blockchain. These off-chain transactions are then settled on the main chain, significantly reducing congestion and transaction costs while maintaining security guarantees. Each Hydra head can theoretically process 1,000 TPS, with the ability to run multiple heads in parallel.

The mainnet launch follows years of development and extensive testing on testnets. Initial applications leveraging Hydra include decentralized exchanges, gaming platforms, and micropayment systems that require high throughput and low latency. Several prominent Cardano projects have already announced plans to integrate Hydra into their infrastructure.

Cardano founder Charles Hoskinson stated that Hydra represents a critical step in Cardano's roadmap toward becoming a global financial operating system. The scaling solution addresses one of the primary limitations that have constrained blockchain adoption: the inability to process transactions at volumes comparable to traditional payment networks.

Market reaction to the Hydra launch has been positive, with ADA, Cardano's native cryptocurrency, gaining 10% in value following the announcement. Blockchain analysts note that successful implementation of Hydra could position Cardano more competitively against other smart contract platforms like Ethereum and Solana. The Cardano developer community has expressed enthusiasm about building applications that leverage Hydra's capabilities.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/sec-charges-major-crypto-exchange-securities-violations',
    title: 'SEC Charges Major Crypto Exchange with Securities Violations in Landmark Case',
    author: 'Jennifer Adams',
    published_at: '2025-10-20T08:45:00Z',
    text_summary: `The United States Securities and Exchange Commission (SEC) has filed charges against a major cryptocurrency exchange for allegedly offering unregistered securities and operating as an unlicensed securities exchange. The case represents one of the most significant regulatory enforcement actions in the cryptocurrency sector and could have far-reaching implications for the industry.

According to the SEC's complaint, the exchange offered trading for numerous tokens that qualify as securities under federal law without proper registration. The regulator also alleges that the exchange operated staking services that constituted investment contracts, further violating securities regulations. The case seeks significant financial penalties and injunctive relief.

The exchange has issued a statement strongly denying the allegations and asserting that the majority of tokens on its platform are commodities, not securities. The company's legal team argues that the SEC is overreaching its jurisdiction and that clearer regulatory guidelines are needed for the cryptocurrency industry. The exchange plans to vigorously defend itself in court.

This enforcement action has sent shockwaves through the cryptocurrency market, with several tokens listed on the exchange experiencing double-digit price declines amid uncertainty about their regulatory status. Other exchanges have begun reviewing their token listings and considering preemptive delistings of assets that might be deemed securities.

Industry advocates argue that the United States needs comprehensive cryptocurrency legislation to provide regulatory clarity rather than relying on enforcement actions against individual companies. Several bills addressing digital asset regulation are currently pending in Congress, but progress has been slow. The outcome of this case could significantly influence how cryptocurrencies are regulated in the United States going forward.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/polygon-zkevm-network-upgrade-improved-performance',
    title: 'Polygon zkEVM Network Upgrade Delivers 40% Performance Improvement',
    author: 'Kevin Martinez',
    published_at: '2025-10-19T12:15:00Z',
    text_summary: `Polygon has successfully completed a major network upgrade to its zkEVM scaling solution, delivering significant performance improvements and reduced transaction costs. The upgrade, which was implemented without any network downtime, represents a major milestone in the evolution of zero-knowledge rollup technology.

The enhanced zkEVM now processes transactions approximately 40% faster than the previous version, with batch proving times reduced from 15 minutes to under 10 minutes. Transaction costs have also decreased by an average of 30%, making the network more accessible for everyday users and applications that require frequent transactions.

Zero-knowledge rollups like Polygon zkEVM bundle hundreds or thousands of transactions together and submit cryptographic proofs to Ethereum's mainnet, providing scalability while inheriting Ethereum's security guarantees. This technology is considered one of the most promising approaches to blockchain scaling and has been a major focus of development across the Ethereum ecosystem.

Several high-profile decentralized applications (dApps) have migrated to Polygon zkEVM in recent months, attracted by the combination of low costs and strong security assurances. Gaming projects, NFT marketplaces, and DeFi protocols have all reported improved user experiences and higher engagement levels after transitioning to the network.

Polygon's co-founder emphasized that this upgrade is just one step in a continuous improvement process, with additional optimizations planned for the coming months. The team is also working on interoperability features that will allow seamless asset transfers between Polygon zkEVM and other layer-2 solutions, contributing to a more connected and efficient Ethereum scaling ecosystem.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/bitcoin-mining-renewable-energy-reaches-60-percent',
    title: 'Bitcoin Mining Industry Reaches 60% Renewable Energy Usage Milestone',
    author: 'Amanda Foster',
    published_at: '2025-10-18T14:00:00Z',
    text_summary: `A comprehensive new study from the Bitcoin Mining Council reveals that the Bitcoin mining industry now derives approximately 60% of its energy from renewable sources, representing a significant improvement in the sector's environmental footprint. This marks substantial progress from just 36% renewable energy usage three years ago.

The shift toward renewable energy has been driven by several factors, including the economic advantages of low-cost renewable power, pressure from environmental advocates, and strategic decisions by mining companies to position themselves as sustainable businesses. Major mining operations in North America and Europe have increasingly located facilities near hydroelectric, solar, and wind power sources.

Bitcoin mining has emerged as an unexpected catalyst for renewable energy development in some regions. Mining operations can provide a consistent baseload demand for renewable energy projects, improving their economic viability and enabling expansion of green energy infrastructure. Some mining facilities operate specifically to monetize excess renewable energy that would otherwise be wasted.

The study also found that Bitcoin mining's total energy consumption has stabilized despite the network's growing hash rate, thanks to improvements in mining hardware efficiency. Modern ASIC miners are significantly more energy-efficient than earlier generations, allowing miners to increase security and processing power without proportional increases in electricity consumption.

Environmental organizations have acknowledged the progress while calling for continued improvement. Some advocates suggest that Bitcoin mining could play a role in balancing electrical grids with high renewable energy penetration, potentially serving as controllable load that can be adjusted based on energy availability. The industry continues to explore innovative solutions for further reducing its carbon footprint.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/federal-reserve-cbdc-pilot-program-launch',
    title: 'Federal Reserve Announces Launch of Digital Dollar CBDC Pilot Program',
    author: 'Thomas Wright',
    published_at: '2025-10-17T09:30:00Z',
    text_summary: `The United States Federal Reserve has officially announced the launch of a pilot program for a central bank digital currency (CBDC), commonly referred to as the digital dollar. This initiative marks a significant step in the Fed's exploration of digital currency technology and its potential role in the future of the U.S. monetary system.

The pilot program will initially involve a limited number of commercial banks and financial institutions that will test the technical infrastructure and operational procedures for a digital dollar. The Fed emphasized that this is purely a research and development initiative and does not represent a commitment to issuing a CBDC. Any decision to create a digital dollar would require authorization from Congress.

According to the Fed's announcement, the digital dollar would be designed to complement, not replace, physical cash and existing digital payment systems. The proposed CBDC would be a direct liability of the Federal Reserve, unlike commercial bank deposits, potentially offering enhanced security and reduced settlement risk for certain types of transactions.

Privacy considerations are a central component of the pilot program's design. The Fed has stated that any eventual digital dollar would need to balance privacy protections with the ability to combat illicit finance and comply with existing financial regulations. The system architecture is being designed with privacy-preserving technologies that would limit the Fed's access to individual transaction data.

The announcement has generated mixed reactions from the cryptocurrency community. Some view it as validation of blockchain and digital currency concepts, while others express concerns about the implications for financial privacy and freedom. Industry experts suggest that a U.S. CBDC could accelerate the digitalization of finance globally, as other central banks are also actively developing or piloting their own digital currencies.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/avalanche-subnet-deployment-financial-institutions',
    title: 'Avalanche Announces Subnet Deployment for Major Financial Institutions',
    author: 'Patricia Johnson',
    published_at: '2025-10-16T11:45:00Z',
    text_summary: `Avalanche has announced the deployment of customized subnets for multiple major financial institutions, marking a significant step toward institutional adoption of blockchain technology for regulated financial services. The subnets will enable these institutions to leverage blockchain benefits while maintaining regulatory compliance and control over their networks.

Avalanche's subnet architecture allows organizations to create customized blockchains that can operate with their own rules, validators, and permission structures while still benefiting from the security and interoperability of the broader Avalanche ecosystem. This flexibility makes the technology particularly attractive for regulated industries with specific compliance requirements.

The participating financial institutions plan to use these subnets for various applications, including securities settlement, tokenized asset trading, and cross-border payments. By operating on permissioned subnets, these institutions can control who participates in their networks while still leveraging the efficiency and transparency benefits of blockchain technology.

Avalanche's approach differs from public blockchains in that it allows institutions to choose their own validators and implement know-your-customer (KYC) and anti-money laundering (AML) procedures at the network level. This design addresses many of the regulatory concerns that have historically prevented financial institutions from adopting public blockchain infrastructure.

The announcement has been well-received by both the cryptocurrency and traditional finance communities. Blockchain advocates view it as evidence of growing institutional recognition of the technology's value, while traditional finance professionals appreciate the ability to maintain necessary regulatory controls. AVAX, Avalanche's native token, rose 9% following the news as market participants anticipate increased network activity.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/nft-market-recovery-trading-volume-surges',
    title: 'NFT Market Shows Strong Recovery as Trading Volume Surges 150% in October',
    author: 'Daniel Kim',
    published_at: '2025-10-15T13:30:00Z',
    text_summary: `The non-fungible token (NFT) market is experiencing a strong recovery, with trading volume in October surging 150% compared to the previous month. This resurgence comes after more than a year of declining activity and suggests renewed interest in digital collectibles and blockchain-based art.

The recovery has been driven by several factors, including the launch of new NFT collections from prominent artists and brands, improvements in NFT marketplace user experience, and the introduction of innovative utility features that extend beyond simple ownership. Gaming-related NFTs and virtual real estate in metaverse platforms have been particularly strong performers.

Major NFT marketplaces like OpenSea, Blur, and Magic Eden have all reported significant increases in both transaction volume and unique active users. The number of new wallets interacting with NFT contracts has increased by over 80% month-over-month, indicating fresh entrants to the market rather than just existing users becoming more active.

High-profile NFT collections such as CryptoPunks and Bored Ape Yacht Club have seen their floor prices increase by 30-50% over the past month. However, the recovery extends beyond blue-chip collections, with mid-tier projects and new launches also experiencing strong demand. This broad-based strength suggests a more sustainable recovery than previous NFT market peaks.

Industry analysts attribute the renewed interest to a combination of factors, including overall cryptocurrency market strength, improved economic conditions, and the maturation of NFT technology and use cases. Several traditional art galleries and auction houses have expanded their NFT offerings, bringing additional legitimacy and reach to the market. The integration of NFTs with social media platforms has also made digital collectibles more accessible to mainstream users.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/chainlink-price-feeds-integration-tradfi-platforms',
    title: 'Chainlink Price Feeds Now Integrated Across 100+ Traditional Finance Platforms',
    author: 'Mark Anderson',
    published_at: '2025-10-14T10:00:00Z',
    text_summary: `Chainlink, the leading decentralized oracle network, has announced that its price feeds are now integrated across more than 100 traditional finance (TradFi) platforms. This milestone represents significant progress in bridging blockchain technology with conventional financial infrastructure and demonstrates growing institutional trust in decentralized data solutions.

The integrated platforms include major banks, asset managers, insurance companies, and fintech applications that require reliable, tamper-proof pricing data for various financial products. Chainlink's price feeds provide real-time market data for cryptocurrencies, commodities, foreign exchange rates, and other assets, enabling these institutions to offer crypto-related products and services.

Chainlink's oracle network aggregates data from multiple independent data providers and node operators, creating a decentralized system that is resistant to manipulation and single points of failure. This architecture addresses a critical need in financial markets for trustworthy data sources that can't be controlled by any single entity.

Several banks have specifically integrated Chainlink price feeds to support their newly launched cryptocurrency custody and trading services. The reliable pricing data enables these institutions to provide accurate valuations for client portfolios and execute trades at fair market prices. Insurance companies are using the feeds to offer crypto-related insurance products with proper risk assessment.

The expansion into traditional finance represents a significant validation of Chainlink's technology and the broader concept of decentralized oracles. Industry experts suggest that reliable oracle infrastructure is essential for the next phase of blockchain adoption, particularly as real-world assets become increasingly tokenized. LINK, Chainlink's native token, has gained 15% in value following the announcement.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/coinbase-layer2-base-network-tvl-milestone',
    title: "Coinbase's Base Network Surpasses $5 Billion in Total Value Locked",
    author: 'Rachel Green',
    published_at: '2025-10-13T15:15:00Z',
    text_summary: `Base, the layer-2 network developed by Coinbase, has surpassed $5 billion in total value locked (TVL), cementing its position as one of the fastest-growing blockchain networks in the cryptocurrency ecosystem. This milestone was reached just seven months after the network's mainnet launch, demonstrating exceptional adoption rates.

The rapid growth of Base has been attributed to several factors, including seamless integration with Coinbase's massive user base, low transaction fees, and a thriving ecosystem of decentralized applications. The network leverages Optimism's OP Stack technology, providing a secure and efficient scaling solution for Ethereum while maintaining compatibility with existing Ethereum tools and smart contracts.

Base has attracted a diverse range of applications, from DeFi protocols and NFT marketplaces to social media platforms and gaming projects. Popular DeFi applications on Base include decentralized exchanges, lending protocols, and yield farming platforms that benefit from the network's low fees and fast transaction finality. The network processes over one million transactions daily.

Coinbase has strategically positioned Base as an open platform rather than a closed ecosystem, encouraging developers from across the cryptocurrency space to build on the network. The company has launched grant programs and developer support initiatives to accelerate ecosystem growth. Several prominent Web3 projects have either launched on Base or added it as a supported network.

Industry observers note that Base's success represents a significant shift in the competitive landscape of Ethereum layer-2 solutions. The network's deep integration with Coinbase's infrastructure and user base provides advantages that independent layer-2 networks may struggle to match. The success of Base has prompted other centralized exchanges to explore launching their own layer-2 networks.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/binance-bnb-chain-opbnb-layer2-mainnet',
    title: 'Binance Launches opBNB Layer-2 Solution on BNB Chain Mainnet',
    author: 'Carlos Martinez',
    published_at: '2025-10-12T10:45:00Z',
    text_summary: `Binance has officially launched opBNB, an optimistic rollup layer-2 scaling solution built on the BNB Chain, marking a significant upgrade to the ecosystem's infrastructure. The mainnet launch brings dramatically improved transaction throughput and lower costs to one of the world's largest blockchain networks by transaction volume.

opBNB utilizes Optimism's OP Stack technology, similar to Base and other successful layer-2 networks, but is optimized specifically for the BNB Chain ecosystem. The network can process over 4,000 transactions per second with gas fees averaging less than $0.005, making it one of the most cost-effective blockchain platforms for developers and users.

Early applications deploying on opBNB include gaming platforms, social media dApps, and high-frequency trading protocols that require fast finality and minimal transaction costs. Several major projects from the broader BNB ecosystem have announced plans to migrate or expand to opBNB to take advantage of the improved performance characteristics.

The launch positions BNB Chain to compete more effectively with Ethereum's layer-2 ecosystem and other high-performance blockchains. Binance has committed significant resources to building out the opBNB ecosystem, including developer grants, technical support, and marketing initiatives aimed at attracting new projects to the platform.

Market analysts view the opBNB launch as part of Binance's broader strategy to maintain and expand its position in the increasingly competitive blockchain infrastructure market. BNB's price rose 6% following the announcement, and network activity metrics show significant increases in both transaction volume and unique active addresses.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/uniswap-v4-launch-hooks-concentrated-liquidity',
    title: 'Uniswap V4 Launches with Customizable Hooks and Enhanced Liquidity Options',
    author: 'Sophie Williams',
    published_at: '2025-10-11T14:20:00Z',
    text_summary: `Uniswap, the leading decentralized exchange protocol, has launched version 4 (V4) with groundbreaking new features including customizable hooks and enhanced liquidity management options. This major upgrade represents the most significant evolution of the Uniswap protocol since V3's introduction of concentrated liquidity positions.

The hooks feature allows developers to create custom logic that executes before or after swaps, liquidity provision, and other pool actions. This programmability enables a wide range of innovative use cases, including dynamic fees, on-chain limit orders, time-weighted average price (TWAP) oracles, and automated portfolio rebalancing strategies.

Uniswap V4 also introduces significant gas optimizations through a new singleton contract architecture, where all pools exist within a single contract rather than separate deployments. This design reduces deployment costs by up to 99% and swap costs by approximately 50% compared to V3, making the protocol more accessible for smaller trades and liquidity providers.

The protocol maintains backward compatibility with existing Uniswap V3 positions and integrations, ensuring a smooth transition for users and developers. Major DeFi aggregators and wallet providers have already integrated V4 support, and trading volume on the new pools has grown rapidly since launch.

Industry experts predict that Uniswap V4's programmability will unlock new DeFi primitives and use cases that weren't previously possible with automated market makers. The UNI governance token saw a 14% price increase following the launch, and trading activity across Uniswap has reached new all-time highs as users experiment with the enhanced features.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/tether-usdt-transparency-report-reserves',
    title: 'Tether Releases Comprehensive Transparency Report, Reveals $3.2B in Excess Reserves',
    author: 'Jonathan Lee',
    published_at: '2025-10-10T09:00:00Z',
    text_summary: `Tether, the issuer of the world's largest stablecoin USDT, has released its most comprehensive transparency report to date, revealing $3.2 billion in excess reserves backing its $83 billion in circulating tokens. The report, audited by a top-tier accounting firm, provides unprecedented detail into the company's reserve composition and operations.

The reserve breakdown shows that 85% of Tether's backing consists of cash, cash equivalents, and short-term U.S. Treasury bills, with the remainder in corporate bonds, secured loans, and other investments. This conservative allocation addresses long-standing questions about the stability and liquidity of USDT's backing.

Tether's report also discloses that the company generated $4.5 billion in net profits over the past year, primarily from interest earned on its Treasury bill holdings. The substantial profitability demonstrates the economic success of the stablecoin business model and provides additional assurance of Tether's financial strength.

The transparency initiative comes amid increasing regulatory scrutiny of stablecoins globally. Multiple jurisdictions are developing comprehensive frameworks for stablecoin regulation, and Tether's proactive disclosure is widely seen as an effort to maintain its market position and regulatory compliance ahead of new rules.

Market reaction has been positive, with USDT maintaining its $1 peg and trading volumes remaining stable. The report has helped address concerns among some institutional users who had been hesitant to use USDT due to transparency questions. Cryptocurrency analysts note that this level of disclosure sets a new standard for the stablecoin industry.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/polkadot-parachain-auctions-ecosystem-growth',
    title: 'Polkadot Ecosystem Surges as 50th Parachain Successfully Launches',
    author: 'Victoria Chen',
    published_at: '2025-10-09T16:30:00Z',
    text_summary: `The Polkadot ecosystem has reached a significant milestone with the successful launch of its 50th parachain, demonstrating the growing adoption of Polkadot's multi-chain architecture. The latest parachain focuses on decentralized identity solutions and joins a diverse ecosystem spanning DeFi, gaming, NFTs, and enterprise blockchain applications.

Polkadot's parachain model allows independent blockchains to connect to the main relay chain, benefiting from shared security while maintaining sovereignty over their governance and functionality. This design enables interoperability between chains and allows projects to customize their blockchain parameters to suit specific use cases.

The 50 active parachains collectively process over 10 million transactions daily and have attracted billions in total value locked across various DeFi protocols. Notable parachains include Moonbeam (EVM-compatible smart contracts), Acala (DeFi hub), and Astar (multi-chain dApp platform), each serving distinct roles within the broader ecosystem.

Recent technical upgrades to Polkadot's relay chain have improved cross-chain messaging speed and reduced transaction costs across the network. The upcoming asynchronous backing feature is expected to further enhance parachain performance, potentially tripling transaction throughput while maintaining security guarantees.

DOT, Polkadot's native token, has gained 11% in value this week as investors recognize the ecosystem's growth trajectory. The network's founder, Gavin Wood, stated that Polkadot is delivering on its vision of a truly interoperable Web3 infrastructure, with several high-profile projects planning to launch parachains in the coming months.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/grayscale-bitcoin-trust-spot-etf-conversion',
    title: 'Grayscale Bitcoin Trust Completes Conversion to Spot ETF Format',
    author: 'Brian Thompson',
    published_at: '2025-10-08T11:15:00Z',
    text_summary: `Grayscale Investments has successfully completed the conversion of its flagship Bitcoin Trust (GBTC) to a spot Bitcoin ETF format, eliminating the discount to net asset value that had plagued the trust for years. The conversion represents a major milestone for both Grayscale and the broader cryptocurrency investment landscape.

GBTC, which once traded at a significant discount to its underlying Bitcoin holdings, now trades at its net asset value like other spot ETFs. The conversion has unlocked billions in previously trapped value for long-term GBTC shareholders who can now redeem their shares at fair value or trade them without the discount penalty.

The newly converted ETF features a reduced management fee of 1.5%, down from the previous 2% but still higher than some competitors. Despite the fee difference, GBTC has maintained substantial assets under management due to its established presence and the reluctance of some holders to trigger taxable events by switching to lower-cost alternatives.

Trading volume for the converted GBTC has surged significantly, with daily volumes averaging $500 million compared to $150 million before the conversion. The increased liquidity and elimination of the discount have made GBTC a more attractive option for institutional investors seeking Bitcoin exposure through traditional brokerage accounts.

Industry analysts note that the conversion marks the culmination of a multi-year journey for Grayscale and its parent company, Digital Currency Group. The success of GBTC's conversion may pave the way for Grayscale to convert other trust products, including its Ethereum Trust, to ETF format in the near future.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/arbitrum-gaming-ecosystem-immutable-partnership',
    title: 'Arbitrum and Immutable Announce Strategic Partnership for Web3 Gaming',
    author: 'Nicole Davis',
    published_at: '2025-10-07T13:45:00Z',
    text_summary: `Arbitrum, one of Ethereum's leading layer-2 scaling solutions, has announced a strategic partnership with Immutable, a prominent Web3 gaming platform. The collaboration aims to bring Immutable's gaming infrastructure and developer tools to Arbitrum's high-performance network, potentially attracting hundreds of new games to the ecosystem.

Under the partnership, Immutable will deploy its zkEVM gaming platform on Arbitrum, creating a specialized gaming subnet optimized for game developers. This integration will combine Immutable's game-focused tools and SDKs with Arbitrum's scalability and security, providing developers with a comprehensive solution for building blockchain games.

The gaming sector represents one of the most promising use cases for blockchain technology, with the potential to reach millions of mainstream users. However, most existing blockchain networks struggle to provide the transaction throughput and low costs required for gaming applications. This partnership addresses those limitations by leveraging Arbitrum's proven scaling technology.

Several high-profile game studios have already committed to building on the new gaming-focused infrastructure, with titles ranging from casual mobile games to complex multiplayer experiences. The partnership includes a $100 million developer fund to support game studios migrating to or building on the platform.

Market participants have responded enthusiastically to the announcement, with ARB (Arbitrum's token) gaining 8% and IMX (Immutable's token) surging 12%. Gaming-focused cryptocurrency analysts suggest this partnership could accelerate the adoption of Web3 gaming by providing developers with enterprise-grade infrastructure and support.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/paypal-stablecoin-pyusd-expansion-ethereum-solana',
    title: 'PayPal Expands PYUSD Stablecoin to Solana Network After Ethereum Success',
    author: 'Gregory Stone',
    published_at: '2025-10-06T10:20:00Z',
    text_summary: `PayPal has announced the expansion of its USD-backed stablecoin, PYUSD, to the Solana blockchain, following the successful launch and adoption on Ethereum. This multi-chain strategy aims to leverage Solana's high transaction speed and low costs to enable new use cases for the stablecoin.

Since its launch on Ethereum last year, PYUSD has grown to over $1.5 billion in circulation and has been integrated into numerous DeFi protocols and payment applications. The expansion to Solana is expected to accelerate adoption, particularly for high-frequency use cases such as micro-payments, gaming transactions, and cross-border remittances.

Solana's technical characteristics make it particularly well-suited for payment applications, with the network capable of processing thousands of transactions per second at costs typically below $0.001 per transaction. This cost structure enables use cases that would be economically unviable on more expensive networks.

PayPal has partnered with several major Solana ecosystem projects to ensure deep integration of PYUSD across DeFi protocols, NFT marketplaces, and payment applications. The company is also working with merchants and payment processors to enable PYUSD acceptance at point-of-sale systems and e-commerce platforms.

The announcement represents a significant endorsement of Solana's technology and ecosystem by one of the world's largest payment companies. SOL's price increased 7% following the news, and analysts project that PYUSD could become one of the largest stablecoins on the Solana network within months.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/aave-v4-real-world-assets-institutional-defi',
    title: 'Aave V4 Introduces Support for Real-World Assets and Institutional Features',
    author: 'Michelle Parker',
    published_at: '2025-10-05T15:00:00Z',
    text_summary: `Aave, the leading decentralized lending protocol, has launched version 4 (V4) with groundbreaking support for real-world asset (RWA) collateral and institutional-grade features. The upgrade marks a significant expansion of Aave's addressable market beyond crypto-native assets into traditional financial instruments.

Aave V4 enables users to borrow against tokenized real-world assets including Treasury bills, corporate bonds, real estate, and invoices. This functionality bridges traditional finance with DeFi, allowing asset owners to unlock liquidity from real-world holdings while maintaining ownership. Initial partnerships include several major tokenization platforms and asset managers.

The protocol introduces enhanced risk management features specifically designed for RWA collateral, including external credit ratings integration, legal compliance checks, and sophisticated liquidation mechanisms appropriate for less-liquid assets. These features address regulatory concerns while maintaining the permissionless nature of the core protocol.

Institutional features in V4 include permissioned pools that comply with KYC/AML requirements, customizable risk parameters, and integration with traditional custody solutions. These additions make Aave accessible to regulated financial institutions that previously couldn't participate in DeFi due to compliance constraints.

The RWA lending market represents a multi-trillion dollar opportunity, and Aave V4 positions the protocol to capture a meaningful share of this emerging sector. AAVE token holders have voted to allocate protocol revenues toward insurance funds backing RWA pools, demonstrating confidence in this strategic direction. The AAVE token price surged 16% following the V4 announcement.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/cosmos-interchain-security-adoption-consumer-chains',
    title: 'Cosmos Hub Achieves 20 Consumer Chains Through Interchain Security',
    author: 'Steven Rodriguez',
    published_at: '2025-10-04T12:30:00Z',
    text_summary: `The Cosmos Hub has reached a milestone of 20 consumer chains utilizing its Interchain Security feature, demonstrating growing adoption of the shared security model. This achievement strengthens Cosmos Hub's position as the central hub of the broader Cosmos ecosystem and creates new utility for ATOM stakers.

Interchain Security allows smaller or newer blockchains to leverage the security of the Cosmos Hub's large validator set without needing to bootstrap their own security from scratch. Consumer chains pay a portion of their revenue to ATOM stakers in exchange for this security, creating a sustainable economic model that benefits both parties.

The 20 consumer chains span diverse use cases including DeFi protocols, NFT platforms, gaming networks, and specialized data availability layers. Combined, these chains process over 5 million transactions daily and represent billions in total value locked, all secured by the Cosmos Hub's validator set.

This shared security model addresses one of the primary challenges faced by new blockchain projects: establishing sufficient economic security to resist attacks. By leveraging the Cosmos Hub's proven security, new projects can launch faster and focus resources on building their applications rather than recruiting validators.

ATOM's price has benefited from the growing revenue stream generated by consumer chains, rising 9% over the past week. Cosmos founder Jae Kwon noted that Interchain Security is fulfilling the original vision of the Cosmos Hub as a platform for sovereign, interoperable blockchains. Several high-profile projects have announced plans to become consumer chains in the coming months.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/ethereum-eip-4844-proto-danksharding-success',
    title: 'Ethereum Proto-Danksharding Slashes Layer-2 Fees by 90% in First Month',
    author: 'Oliver Zhang',
    published_at: '2025-10-03T09:15:00Z',
    text_summary: `Ethereum's recent implementation of EIP-4844, also known as proto-danksharding, has proven remarkably successful in its first month of operation, with layer-2 transaction fees dropping by an average of 90%. The upgrade introduces blob transactions that provide dedicated data availability space for rollups at significantly reduced costs.

Proto-danksharding creates a new transaction type specifically for layer-2 rollups to post their data to Ethereum mainnet. This dedicated space is cheaper than traditional calldata and can handle much larger volumes, dramatically reducing the costs that layer-2 networks must pay to settle on Ethereum.

Major layer-2 networks including Arbitrum, Optimism, Base, and zkSync have all reported substantial cost reductions following the upgrade. These savings are being passed on to end users, with transaction fees on many layer-2 networks now averaging less than $0.01. The reduced costs have driven a significant increase in transaction volume across the layer-2 ecosystem.

The success of proto-danksharding validates Ethereum's rollup-centric scaling roadmap and sets the stage for future upgrades including full danksharding. Ethereum developers are already working on the next phases of scaling improvements, which could further increase data availability capacity by orders of magnitude.

Layer-2 adoption metrics have accelerated dramatically since the upgrade, with total value locked across all Ethereum layer-2 networks increasing by 40% in just one month. Transaction volumes on layer-2 networks now exceed Ethereum mainnet by a factor of five, demonstrating the success of Ethereum's scaling strategy.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/circle-usdc-cross-chain-transfer-protocol',
    title: 'Circle Launches Cross-Chain Transfer Protocol for USDC',
    author: 'Andrew Mitchell',
    published_at: '2025-10-02T14:45:00Z',
    text_summary: `Circle, the issuer of USD Coin (USDC), has launched its Cross-Chain Transfer Protocol (CCTP), enabling native USDC transfers between different blockchain networks without the need for wrapped tokens or bridges. The protocol represents a major advancement in stablecoin interoperability and user experience.

CCTP allows users to burn USDC on one chain and mint it natively on another chain in a single transaction. This eliminates the complexity and risks associated with traditional bridge solutions, where users often end up with wrapped versions of assets that may have limited liquidity or acceptance.

The initial launch supports transfers between Ethereum, Arbitrum, Optimism, Polygon, Avalanche, and Solana, with plans to add support for additional networks in the coming months. The protocol uses a hub-and-spoke architecture with multiple validators ensuring security and censorship resistance.

Early adoption metrics show strong demand for native cross-chain USDC transfers, with over $500 million in volume processed in the first week. The simplified user experience is particularly beneficial for retail users who previously struggled with complex bridging processes and multiple token standards.

The launch strengthens USDC's position in the competitive stablecoin market by addressing a key pain point for users operating across multiple blockchain ecosystems. DeFi protocols and payment applications have begun integrating CCTP to provide seamless multi-chain experiences. USDC's total circulation has grown by $2 billion since the announcement as demand for the improved functionality increases.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/maker-dao-rebrand-sky-usds-stablecoin',
    title: 'MakerDAO Completes Rebrand to Sky, Launches Upgraded USDS Stablecoin',
    author: 'Christina Lee',
    published_at: '2025-10-01T11:00:00Z',
    text_summary: `MakerDAO, one of DeFi's oldest and most established protocols, has completed its transformation to Sky, unveiling a comprehensive rebrand alongside the launch of USDS, an upgraded version of the DAI stablecoin. The changes aim to make the protocol more accessible to mainstream users while maintaining its decentralized principles.

The new USDS stablecoin maintains the same stability mechanism as DAI but features enhanced user experience elements including native yield generation and simplified earning opportunities. Existing DAI holders can seamlessly upgrade to USDS through a one-way conversion mechanism, though DAI will continue to be supported indefinitely.

Sky's governance token, SKY, replaces MKR with an improved tokenomics model that includes enhanced rewards for governance participants and clearer value accrual mechanisms. The migration maintains continuity for existing MKR holders who can convert their tokens at a predetermined ratio.

The rebrand includes a complete redesign of the protocol's user interfaces with a focus on simplicity and mainstream appeal. New features include one-click savings products, simplified vault management, and integration with popular wallet providers. The changes are designed to compete more effectively with centralized stablecoins by offering comparable ease of use alongside decentralization benefits.

Market reaction has been mixed, with some community members expressing concerns about the potential dilution of the MakerDAO brand recognition built over years. However, early metrics show increased user engagement with the new interfaces, and USDS adoption is growing rapidly. The protocol's total value locked has remained stable throughout the transition, suggesting strong existing user retention.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/sui-blockchain-mainnet-milestone-transaction-volume',
    title: 'Sui Network Processes Record 100 Million Daily Transactions',
    author: 'Derek Hamilton',
    published_at: '2025-09-30T16:00:00Z',
    text_summary: `Sui, the layer-1 blockchain developed by Mysten Labs, has achieved a record milestone of processing over 100 million transactions in a single day, demonstrating the network's exceptional scalability and growing ecosystem adoption. This achievement places Sui among the highest-throughput blockchain networks globally.

The transaction surge was driven by a combination of gaming applications, DeFi protocols, and NFT minting activities across the Sui ecosystem. The network maintained sub-second finality and transaction costs below $0.001 throughout the high-activity period, showcasing its ability to handle mainstream-scale usage without degradation in user experience.

Sui's architecture utilizes a novel consensus mechanism called Narwhal and Bullshark, which enables parallel transaction processing and eliminates many of the bottlenecks that constrain traditional blockchain designs. The network's Move programming language, originally developed for Facebook's Diem project, provides enhanced security and expressiveness for smart contract development.

The ecosystem has grown rapidly in recent months, with over 200 projects now building on Sui across categories including gaming, DeFi, social applications, and digital identity. Several major gaming studios have chosen Sui as their blockchain platform, citing its performance characteristics and developer-friendly tooling.

SUI, the network's native token, has gained 13% in value over the past week as market participants recognize the protocol's technical achievements and ecosystem growth. Mysten Labs announced plans to further optimize the network's performance, targeting sustained throughput of over 200 million transactions per day in the next major upgrade.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/blackrock-tokenized-treasury-fund-buidl-growth',
    title: "BlackRock's Tokenized Treasury Fund Surpasses $1 Billion in Assets",
    author: 'Ryan Cooper',
    published_at: '2025-09-29T10:30:00Z',
    text_summary: `BlackRock's USD Institutional Digital Liquidity Fund (BUIDL), a tokenized money market fund offering exposure to U.S. Treasury bills, has surpassed $1 billion in assets under management within six months of launch. The milestone demonstrates strong institutional demand for tokenized traditional financial instruments on blockchain infrastructure.

BUIDL is built on the Ethereum blockchain and provides institutional investors with instant settlement, 24/7 trading, and transparent on-chain tracking of holdings. The fund distributes daily dividends directly to investors' wallets and can be integrated into DeFi protocols, creating new opportunities for yield generation and collateralization.

The rapid growth of BUIDL reflects broader institutional interest in tokenized real-world assets as a bridge between traditional finance and blockchain technology. Several other asset managers have launched similar products, but BlackRock's brand recognition and institutional relationships have given BUIDL a significant competitive advantage.

Integration with major DeFi protocols has expanded BUIDL's utility beyond simple Treasury bill exposure. The tokens are now accepted as collateral in lending protocols, used in liquidity pools, and integrated into structured products. This composability demonstrates the unique advantages of tokenized assets compared to traditional fund structures.

Financial analysts view BlackRock's success with BUIDL as validation of the tokenization thesis and expect accelerated growth in the tokenized asset sector. The success has prompted BlackRock to explore additional tokenized products, including funds focused on other fixed-income instruments and potentially equities. Industry experts project the tokenized Treasury market could reach $50 billion within two years.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/aptos-blockchain-upgrade-performance-boost',
    title: 'Aptos Network Upgrade Delivers 200% Performance Improvement',
    author: 'Leslie Morgan',
    published_at: '2025-09-28T13:15:00Z',
    text_summary: `Aptos, the layer-1 blockchain built by former Meta engineers, has completed a major network upgrade that delivers a 200% improvement in transaction processing capacity. The upgrade optimizes the network's Block-STM parallel execution engine and implements several consensus mechanism enhancements.

Following the upgrade, Aptos can now process over 160,000 transactions per second in optimal conditions, with real-world throughput sustained above 30,000 TPS during peak usage periods. Transaction finality remains under one second, and fees continue to average below $0.01, maintaining Aptos's position as one of the most performant blockchain platforms.

The performance improvements enable new categories of applications that require high throughput and low latency, including real-time gaming, high-frequency trading, and social media platforms. Several major projects have announced plans to build on Aptos following the upgrade, citing the improved technical capabilities.

Aptos's Move programming language, shared with Sui but implemented with different design choices, continues to attract developers seeking enhanced security and formal verification capabilities. The language's resource-oriented design prevents entire categories of smart contract vulnerabilities that have led to significant losses on other platforms.

APT, the network's native token, surged 10% following the successful upgrade implementation. Network metrics show increasing adoption with daily active addresses growing 45% month-over-month and total value locked in Aptos DeFi protocols reaching $300 million. The Aptos Foundation has announced additional grants and developer support programs to accelerate ecosystem growth.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/lightning-network-capacity-bitcoin-payments',
    title: "Bitcoin's Lightning Network Capacity Reaches 6,000 BTC Milestone",
    author: 'Marcus Thompson',
    published_at: '2025-09-27T09:45:00Z',
    text_summary: `The Bitcoin Lightning Network has achieved a new milestone with total network capacity surpassing 6,000 BTC (approximately $570 million at current prices). This growth demonstrates increasing adoption of Bitcoin's primary layer-2 scaling solution for fast, low-cost payments.

The Lightning Network enables instant Bitcoin transactions by establishing payment channels between users, with final settlement occurring on the Bitcoin mainnet. This architecture allows for unlimited transaction throughput at minimal cost, making Bitcoin practical for everyday payments and micropayments that would be uneconomical on the main chain.

Network statistics show consistent growth across all metrics, with the number of public channels exceeding 80,000 and routing nodes approaching 15,000. Importantly, these figures don't include private channels, meaning the actual network capacity and activity are significantly higher than publicly visible statistics suggest.

Major payment processors and exchanges have integrated Lightning Network support, enabling faster and cheaper Bitcoin withdrawals and deposits. Some merchants now accept Lightning payments directly, and several countries with high Bitcoin adoption have seen Lightning emerge as a preferred payment method for everyday transactions.

The growth in Lightning capacity correlates with increasing interest in Bitcoin as a payment system rather than solely as a store of value. Developers continue enhancing the Lightning protocol with new features including improved routing algorithms, better channel management, and enhanced privacy protections. Industry observers project Lightning capacity could reach 10,000 BTC within the next year as adoption accelerates.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/metamask-snaps-plugin-ecosystem-launch',
    title: 'MetaMask Snaps Plugin Ecosystem Surpasses 10 Million Installs',
    author: 'Diana Foster',
    published_at: '2025-09-26T15:30:00Z',
    text_summary: `MetaMask Snaps, the plugin system that extends MetaMask wallet functionality, has surpassed 10 million total installations across its various plugins. The milestone demonstrates strong user demand for enhanced wallet capabilities and validates MetaMask's strategy of creating an open platform for third-party development.

Snaps enable developers to add new features to MetaMask without requiring changes to the core wallet software. Popular snaps include support for non-EVM blockchains, enhanced transaction simulation, portfolio tracking, notification systems, and advanced security features. The most popular snap, which adds Bitcoin support to MetaMask, accounts for over 2 million installations alone.

The plugin architecture addresses a key challenge in cryptocurrency wallet development: balancing feature richness with simplicity and security. Rather than bloating the core wallet with every possible feature, Snaps allows users to customize their MetaMask experience by installing only the functionality they need.

Security reviews and developer audits help ensure snap quality, though users must still exercise caution when installing third-party code. MetaMask has implemented a permission system that limits what snaps can access and requires user approval for sensitive operations.

The success of Snaps has influenced other wallet providers to explore similar plugin architectures. ConsenSys, MetaMask's parent company, has established a developer grant program to support snap development and has organized hackathons focused on innovative use cases. The open platform approach is expected to accelerate MetaMask's evolution and help maintain its position as the leading Ethereum wallet.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/compound-finance-v3-multi-chain-deployment',
    title: 'Compound Finance V3 Expands to 10 Blockchain Networks',
    author: 'Kenneth White',
    published_at: '2025-09-25T11:00:00Z',
    text_summary: `Compound Finance, a pioneering DeFi lending protocol, has expanded its V3 deployment to 10 different blockchain networks, implementing a true multi-chain strategy. The expansion enables users across different ecosystems to access Compound's lending and borrowing services while maintaining unified liquidity and governance.

The 10 supported networks include Ethereum, Arbitrum, Optimism, Polygon, Base, Avalanche, BNB Chain, Fantom, Moonbeam, and Celo. Each deployment is tailored to the specific characteristics of its host chain while maintaining interoperability through Compound's cross-chain governance system.

Compound V3 introduces significant improvements over earlier versions, including isolated risk pools that prevent contagion between different asset markets, enhanced capital efficiency allowing higher utilization rates, and improved interest rate models that respond more dynamically to market conditions.

The multi-chain strategy addresses a fundamental challenge in DeFi: liquidity fragmentation. By deploying across multiple networks, Compound can serve users where they prefer to transact while maintaining deep liquidity through its cross-chain architecture. The protocol's governance token, COMP, functions uniformly across all chains.

Total value locked in Compound V3 across all chains has reached $4.5 billion, with the multi-chain deployment driving significant growth in borrowing and lending activity. The expansion has attracted new users from each ecosystem while enabling existing users to access Compound services on lower-cost networks. COMP token price increased 8% following the announcement of the final chain deployments.`,
  },
  {
    source_name: 'Cointelegraph',
    url: 'https://cointelegraph.com/news/ordinals-bitcoin-nfts-ecosystem-growth',
    title: 'Bitcoin Ordinals NFT Sales Exceed $2 Billion in Total Volume',
    author: 'Samantha Brooks',
    published_at: '2025-09-24T14:15:00Z',
    text_summary: `Bitcoin Ordinals, the protocol for creating NFTs directly on the Bitcoin blockchain, has surpassed $2 billion in cumulative trading volume since its launch earlier this year. The milestone marks Bitcoin's emergence as a significant player in the NFT market, traditionally dominated by Ethereum.

Ordinals works by inscribing data directly onto individual satoshis (the smallest unit of Bitcoin), creating unique, immutable digital artifacts on the Bitcoin blockchain. Unlike Ethereum NFTs which typically store only metadata on-chain with images hosted elsewhere, Ordinals store complete data on Bitcoin, offering true immutability and permanence.

The most valuable Ordinals collections have achieved floor prices comparable to established Ethereum NFT projects, with some individual inscriptions selling for over $1 million. The market has evolved beyond simple image inscriptions to include generative art, interactive experiences, and even entire games inscribed on the Bitcoin blockchain.

Bitcoin's infrastructure has adapted to accommodate Ordinals activity, with major exchanges and marketplaces adding support for trading inscriptions. Some Bitcoin maximalists initially opposed Ordinals as an inefficient use of block space, but the significant transaction fees generated by inscription activity have benefited miners and demonstrated Bitcoin's flexibility.

The growth of Ordinals has sparked debate within the Bitcoin community about the blockchain's purpose and future direction. While some view Ordinals as a distraction from Bitcoin's monetary use case, others see them as validating Bitcoin's utility beyond peer-to-peer payments. Developers continue innovating on the Ordinals protocol with new features and use cases.`,
  },
  {
    source_name: 'CryptoPotato',
    url: 'https://cryptopotato.com/starknet-staking-launch-security-participation',
    title: 'StarkNet Launches Native Staking with 10% APY for STRK Token Holders',
    author: 'Rebecca Martinez',
    published_at: '2025-09-23T10:00:00Z',
    text_summary: `StarkNet, the Ethereum layer-2 network utilizing zero-knowledge rollup technology, has officially launched native staking for its STRK token. The staking mechanism offers yields around 10% APY while enhancing network security through decentralized sequencer operation.

The staking system allows STRK holders to either run their own validator nodes or delegate their tokens to validators operated by others. Validators participate in the network's proof generation and transaction sequencing, earning rewards from transaction fees and protocol emissions. The system includes slashing conditions to discourage malicious behavior and ensure validator reliability.

Initial participation in StarkNet staking has been strong, with over 500 million STRK tokens (approximately 20% of circulating supply) staked within the first week. The high participation rate demonstrates community confidence in the network's long-term prospects and creates additional security through distributed validation.

The launch of native staking marks an important step in StarkNet's progressive decentralization roadmap. Previously, the network relied on centralized sequencers operated by StarkWare, the company behind StarkNet. The transition to decentralized staking distributes control among token holders and validators, reducing centralization risks.

STRK's price increased 12% following the staking launch as tokens moved from liquid circulation into locked staking positions, reducing available supply. Network activity metrics show continued growth with daily transactions exceeding 500,000 and total value locked in StarkNet DeFi protocols reaching $800 million. Several major projects have announced plans to build on StarkNet following the successful staking implementation.`,
  },
  {
    source_name: 'NewsBTC',
    url: 'https://www.newsbtc.com/ethereum-name-service-ens-web3-domains',
    title: 'Ethereum Name Service Surpasses 3 Million Registered Domain Names',
    author: 'Timothy Anderson',
    published_at: '2025-09-22T13:30:00Z',
    text_summary: `Ethereum Name Service (ENS), the decentralized naming system for Ethereum addresses and resources, has surpassed 3 million registered .eth domain names. The milestone demonstrates growing adoption of human-readable identifiers for cryptocurrency wallets and decentralized websites.

ENS domains function like DNS for the decentralized web, translating complex Ethereum addresses into memorable names like "alice.eth". These domains can be used for receiving cryptocurrency payments, accessing decentralized websites, and as digital identity markers across Web3 applications. Integration with major wallets and applications has made ENS a standard feature of the Ethereum ecosystem.

Recent growth has been driven by several factors including lower gas fees making registrations more affordable, increasing integration with mainstream applications, and growing recognition of ENS domains as digital identity assets. Some premium ENS names have sold for hundreds of thousands of dollars, creating a robust secondary market.

ENS has expanded beyond simple address resolution to include support for decentralized content hosting, social media profiles, and cross-chain address resolution. The protocol recently added support for resolving DNS domain names on-chain, creating bridges between traditional internet infrastructure and blockchain-based systems.

The ENS governance token has benefited from growing adoption, with DAO-controlled revenues from domain registrations and renewals providing sustainable funding for continued development. ENS Labs, the core development team, announced plans to enhance multi-chain support and improve the user experience for non-technical users. Several competing naming systems have emerged, but ENS maintains dominant market share and ecosystem integration.`,
  },
];

/**
 * Utility function to get mock articles by date range
 */
export function getMockArticlesByDateRange(startDate: Date, endDate: Date): MockArticle[] {
  return mockArticles.filter((article) => {
    const publishedDate = new Date(article.published_at);
    return publishedDate >= startDate && publishedDate <= endDate;
  });
}

/**
 * Utility function to get mock articles by source
 */
export function getMockArticlesBySource(sourceName: string): MockArticle[] {
  return mockArticles.filter((article) => article.source_name === sourceName);
}

/**
 * Utility function to search mock articles by keyword
 */
export function searchMockArticles(keyword: string): MockArticle[] {
  const lowerKeyword = keyword.toLowerCase();
  return mockArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerKeyword) || article.text_summary.toLowerCase().includes(lowerKeyword),
  );
}
