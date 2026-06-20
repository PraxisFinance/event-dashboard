export type EventStatus = "open" | "resolved" | "cancelled";
export type EventSource = "source" | "praxis";

export interface PredictionEvent {
  id: string;
  sourceId: string | null;
  conditionId: string | null;
  title: string;
  description: string;
  status: EventStatus;
  categories: string[];
  tags: string[];
  /** Unix timestamp in seconds */
  expirationTimestamp: number | null;
  /** Unix timestamp in seconds */
  votingDeadlineTs: number | null;
  resolutionTypeTuple: string | null;
  marketType: string | null;
  slug: string | null;
  source: EventSource;
  onPlatform: boolean;
  contractEventId: string | null;
  contractTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  // Typed market fields
  category: string | null;
  resolutionType: string | null;
  sideALabel: string | null;
  sideBLabel: string | null;
  metadata: Record<string, unknown> | null;
  logoPath: string | null;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return formatDate(new Date(ts * 1000).toISOString());
}

export function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
