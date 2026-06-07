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
}

export interface EnrichedSourceMarket extends SourceMarket {
  deployedEventId: string | null;
  logoPath: string | null;
  subscriptionId: string | null;
}
