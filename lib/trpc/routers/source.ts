import { z } from "zod";
import { protectedProcedure, router } from "../init";
import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  EnrichedSourceMarket,
  SourceMarket,
} from "@/types/source-market";

const CACHE_KEY = "source:active";

async function getMarketCacheStatus(db: PrismaClient) {
  return db.cacheMetadata.findUnique({
    where: { key: CACHE_KEY },
    select: { updatedAt: true, totalCount: true },
  });
}

async function queryMarketCache(
  db: PrismaClient,
  opts: {
    sortBy?: string;
    tradeType?: "amm" | "clob" | "group";
    marketIds?: number[];
    page: number;
    limit: number;
  },
): Promise<{ markets: SourceMarket[]; total: number }> {
  const where: Prisma.CachedMarketWhereInput = {};
  if (opts.tradeType) where.tradeType = opts.tradeType;
  if (opts.marketIds) where.id = { in: opts.marketIds };

  let orderBy: Prisma.CachedMarketOrderByWithRelationInput = { volume: "desc" };
  if (opts.sortBy === "liquidity") orderBy = { liquidity: "desc" };
  else if (opts.sortBy === "expiry") orderBy = { expirationTimestamp: "asc" };
  else if (opts.sortBy === "newest") orderBy = { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    db.cachedMarket.findMany({
      where,
      orderBy,
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      select: { data: true },
    }),
    db.cachedMarket.count({ where }),
  ]);

  return {
    markets: rows.map((r) => r.data as unknown as SourceMarket),
    total,
  };
}

async function enrichWithDeploymentStatus(
  markets: SourceMarket[],
  db: PrismaClient,
): Promise<EnrichedSourceMarket[]> {
  if (markets.length === 0) return [];

  const marketIds = markets.map((m) => String(m.id));
  const stableSlugs = markets
    .map((m) => m.stableSlug)
    .filter((s): s is string => Boolean(s));

  const [deployedEvents, subscriptions] = await Promise.all([
    db.event.findMany({
      where: { sourceId: { in: marketIds } },
      select: { id: true, sourceId: true, logoPath: true },
    }),
    stableSlugs.length > 0
      ? db.subscription.findMany({
          where: { stableSlug: { in: stableSlugs } },
          select: { id: true, stableSlug: true },
        })
      : Promise.resolve([]),
  ]);

  const deployedMap = new Map(
    deployedEvents
      .filter((e) => e.sourceId !== null)
      .map((e) => [e.sourceId as string, e]),
  );

  const subscriptionMap = new Map(
    subscriptions.map((s) => [s.stableSlug, s.id]),
  );

  return markets.map((m) => {
    const event = deployedMap.get(String(m.id));
    return {
      ...m,
      deployedEventId: event?.id ?? null,
      logoPath: event?.logoPath ?? null,
      subscriptionId: m.stableSlug
        ? (subscriptionMap.get(m.stableSlug) ?? null)
        : null,
    };
  });
}

function matchesRecentSearch(market: SourceMarket, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    market.title,
    market.description ?? "",
    market.slug,
    market.stableSlug ?? "",
    ...market.categories,
    ...market.tags,
  ].some((value) => value.toLowerCase().includes(q));
}

export const sourceRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          sortBy: z.string().optional(),
          tradeType: z.enum(["amm", "clob", "group"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, sortBy, tradeType } = input ?? {};
      const { markets, total } = await queryMarketCache(ctx.db, { sortBy, tradeType, page, limit });
      const enriched = await enrichWithDeploymentStatus(markets, ctx.db);
      return { markets: enriched, total };
    }),

  /** Returns cache metadata: last updated timestamp and total market count. */
  cacheStatus: protectedProcedure.query(async ({ ctx }) => {
    return getMarketCacheStatus(ctx.db);
  }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(20),
        page: z.number().int().min(1).default(1),
        similarityThreshold: z.number().min(0).max(1).default(0.5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const rows = await ctx.db.cachedMarket.findMany({
        orderBy: { createdAt: "desc" },
        select: { data: true },
      });
      const matched = rows
        .map((row) => row.data as unknown as SourceMarket)
        .filter((market) => matchesRecentSearch(market, input.query));
      const markets = await enrichWithDeploymentStatus(
        matched.slice(offset, offset + input.limit),
        ctx.db,
      );
      return { markets, total: matched.length };
    }),
});
