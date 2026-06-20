export interface PriceOracleMetadata {
  ticker: string;
  assetType: "CRYPTO" | "EQUITY" | string;
  pythAddress?: string;
  chartSource?: string;
  symbol?: string;
  name?: string;
  logo?: string;
}

export interface SourceSubMarket {
  id: number;
  conditionId: string;
  title: string;
  imageUrl?: string;
  logo?: string;
  priceOracleMetadata?: PriceOracleMetadata;
  metadata?: Record<string, unknown>;
}

export interface SourceMarket {
  id: number;
  address: string;
  conditionId: string;
  title: string;
  description?: string;
  logo?: string;
  imageUrl?: string;
  prices?: number[];
  categories: string[];
  tags: string[];
  status: string;
  expired: boolean;
  expirationDate: string;
  expirationTimestamp: number;
  createdAt?: string;
  startAt?: string;
  updatedAt?: string;
  volumeFormatted: string;
  openInterestFormatted: string;
  liquidityFormatted: string;
  tradeType: "amm" | "clob" | "group";
  marketType: string;
  slug: string;
  stableSlug?: string;
  /** Present on single markets with oracle-backed resolution. */
  priceOracleMetadata?: PriceOracleMetadata;
  /** Sub-markets for group events (esports/sport match winners). */
  markets?: SourceSubMarket[];
  /** Raw group-level metadata (esportTitle, homeTeam, type:"ladder", etc.). */
  metadata?: Record<string, unknown>;
}

export interface EnrichedSourceMarket extends SourceMarket {
  deployedEventId: string | null;
  logoPath: string | null;
  subscriptionId: string | null;
}
