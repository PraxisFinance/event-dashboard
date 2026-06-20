import type { EventSource, EventStatus, PredictionEvent } from "@/lib/mock-data";

/** Row shape from Prisma on the server or JSON from tRPC on the client */
export type EventRowInput = {
  id: string;
  sourceId: string | null;
  conditionId: string | null;
  title: string;
  description: string | null;
  status: string;
  categories: string[];
  tags: string[];
  expirationTimestamp: number | null;
  votingDeadlineTs: number | null;
  resolutionTypeTuple: string | null;
  marketType: string | null;
  slug: string | null;
  source: string;
  onPlatform: boolean;
  contractEventId: string | null;
  contractTxHash: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  syncedAt: Date | string | null;
  // Typed market fields
  category: string | null;
  resolutionType: string | null;
  sideALabel: string | null;
  sideBLabel: string | null;
  metadata: unknown;
  logoPath: string | null;
};

function asSource(value: string): EventSource {
  return value === "source" ? "source" : "praxis";
}

function asStatus(value: string): EventStatus {
  if (value === "resolved" || value === "cancelled") return value;
  return "open";
}

function toIso(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString();
}

export function mapDbEventToPredictionEvent(row: EventRowInput): PredictionEvent {
  return {
    id: row.id,
    sourceId: row.sourceId,
    conditionId: row.conditionId,
    title: row.title,
    description: row.description ?? "",
    status: asStatus(row.status),
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    expirationTimestamp: row.expirationTimestamp ?? null,
    votingDeadlineTs: row.votingDeadlineTs ?? null,
    resolutionTypeTuple: row.resolutionTypeTuple ?? null,
    marketType: row.marketType ?? null,
    slug: row.slug ?? null,
    source: asSource(row.source),
    onPlatform: row.onPlatform,
    contractEventId: row.contractEventId,
    contractTxHash: row.contractTxHash,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    syncedAt: row.syncedAt ? toIso(row.syncedAt) : null,
    category: row.category ?? null,
    resolutionType: row.resolutionType ?? null,
    sideALabel: row.sideALabel ?? null,
    sideBLabel: row.sideBLabel ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    logoPath: row.logoPath ?? null,
  };
}
