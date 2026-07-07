"use client";

import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data-display/table";
import type { EnrichedSourceMarket } from "@/types/source-market";
import type { CreateMarketEvent } from "@/components/markets/create-market-dialog";
import { ArrowDown, ArrowUp, ArrowUpDown, Bell, BellRing, CheckCircle2 } from "lucide-react";

interface SourceMarketsTableProps {
  markets: EnrichedSourceMarket[];
  onCreateMarket: (event: CreateMarketEvent) => void;
  onSubscribe?: (market: EnrichedSourceMarket) => void;
  isSortedByExpiration?: boolean;
  expirationSortDir?: "asc" | "desc";
  onSortByExpiration?: () => void;
}

function TradeTypeBadge({ type }: { type: EnrichedSourceMarket["tradeType"] }) {
  if (type === "amm")
    return (
      <Badge className="bg-brand-blue/15 text-brand-blue border-brand-blue/30 text-xs font-medium">
        AMM
      </Badge>
    );
  if (type === "clob")
    return (
      <Badge className="bg-brand-purple/15 text-brand-purple border-brand-purple/30 text-xs font-medium">
        CLOB
      </Badge>
    );
  return (
    <Badge className="bg-secondary text-muted-foreground border-border text-xs font-medium">
      Group
    </Badge>
  );
}

function formatUsdc(formatted: string): string {
  const n = parseFloat(formatted);
  if (Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatExpirationDateTime(market: EnrichedSourceMarket): string {
  const timestamp = market.expirationTimestamp;
  const date = timestamp
    ? new Date(timestamp > 1e10 ? timestamp : timestamp * 1000)
    : new Date(market.expirationDate);

  if (Number.isNaN(date.getTime())) return market.expirationDate || "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toCreateMarketEvent(m: EnrichedSourceMarket): CreateMarketEvent {
  // Group/sport events have no top-level conditionId or description — those live on
  // the individual sub-markets. Fall back to markets[0] so the dialog is pre-filled.
  const firstSubMarket = m.markets?.[0];
  const conditionId = m.conditionId || firstSubMarket?.conditionId || null;
  const description = m.description || firstSubMarket?.description;

  return {
    id: String(m.id),
    title: m.title,
    description,
    expirationTimestamp: m.expirationTimestamp,
    expirationDate: m.expirationDate,
    source: "source",
    conditionId,
    categories: m.categories,
    tags: m.tags,
    marketType: m.marketType,
    slug: m.slug,
    logo: m.logo ?? null,
    markets: m.markets,
    sourceMetadata: m.metadata,
    priceOracleMetadata: m.priceOracleMetadata,
  };
}

export function SourceMarketsTable({
  markets,
  onCreateMarket,
  onSubscribe,
  isSortedByExpiration = false,
  expirationSortDir = "asc",
  onSortByExpiration,
}: SourceMarketsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-medium w-80 py-3">
                Title
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Type
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-right py-3">
                Odds
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-right py-3">
                Volume
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-right py-3">
                Liquidity
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                {onSortByExpiration ? (
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${
                      isSortedByExpiration ? "text-foreground" : ""
                    }`}
                    aria-pressed={isSortedByExpiration}
                    onClick={onSortByExpiration}
                  >
                    Expires
                    {isSortedByExpiration ? (
                      expirationSortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                ) : (
                  "Expires"
                )}
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-right py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.map((market) => (
              <TableRow
                key={market.id}
                className="border-border hover:bg-secondary/50 transition-colors"
              >
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1.5">
                    <a
                      href={`https://source.exchange/markets/${market.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-muted-foreground leading-snug line-clamp-2"
                    >
                      {market.title}
                    </a>
                    {market.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {market.categories.slice(0, 2).map((c) => (
                          <Badge
                            key={c}
                            className="bg-secondary text-muted-foreground border-border text-[10px] px-1.5 py-0 font-normal"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <TradeTypeBadge type={market.tradeType} />
                </TableCell>

                <TableCell className="py-3 text-right">
                  {market.prices && market.prices.length >= 2 ? (
                    <span className="text-xs tabular-nums text-foreground">
                      Yes: {Math.round(market.prices[0])}%{" "}
                      <span className="text-muted-foreground">/</span> No:{" "}
                      {Math.round(market.prices[1])}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span className="text-sm tabular-nums font-mono text-foreground">
                    {formatUsdc(market.volumeFormatted)}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span className="text-sm tabular-nums font-mono text-foreground">
                    {formatUsdc(market.liquidityFormatted)}
                  </span>
                </TableCell>

                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatExpirationDateTime(market)}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    {market.deployedEventId ? (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium">Deployed</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
                        onClick={() => onCreateMarket(toCreateMarketEvent(market))}
                      >
                        Create on Platform
                      </Button>
                    )}
                    {onSubscribe && market.stableSlug && (
                      market.subscriptionId ? (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <BellRing className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium">Subscribed</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                          onClick={() => onSubscribe(market)}
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Subscribe
                        </Button>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
