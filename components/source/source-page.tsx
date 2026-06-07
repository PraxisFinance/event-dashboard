"use client";

import { useState, useMemo, useRef } from "react";
import { Header } from "@/components/layout/header";
import { SourceMarketsTable } from "@/components/source/source-markets-table";
import { SubscribeDialog } from "@/components/source/subscribe-dialog";
import { CreateMarketDialog } from "@/components/markets/create-market-dialog";
import type { CreateMarketEvent } from "@/components/markets/create-market-dialog";
import type { EnrichedSourceMarket } from "@/types/source-market";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Sparkles, X } from "lucide-react";

const PAGE_SIZE = 20;
const STAT_CARD_SKELETON_KEYS = ["total", "amm", "clob", "group"] as const;

function formatRelativeTime(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

type SortKey = "newest" | "volume" | "liquidity" | "expiration";
type TradeTypeFilter = "all" | "amm" | "clob" | "group";

function StatCards({
  total,
}: {
  total: number;
}) {
  const stats = [
    { label: "Total Markets", value: total, desc: "Active on Source" },
    { label: "AMM Markets", value: "—", desc: "Automated market maker" },
    { label: "CLOB Markets", value: "—", desc: "Order book" },
    { label: "Group Markets", value: "—", desc: "Multi-outcome" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="bg-card border-border p-6">
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {s.value}
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
        </Card>
      ))}
    </div>
  );
}

export function SourceEventsPage() {
  // ── Browse state ──────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [tradeType, setTradeType] = useState<TradeTypeFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // ── Semantic search state ─────────────────────────────────
  const [semanticInput, setSemanticInput] = useState("");
  const [semanticQuery, setSemanticQuery] = useState(""); // committed on submit
  const semanticInputRef = useRef<HTMLInputElement>(null);

  // ── Dialog state ──────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<CreateMarketEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscribeTarget, setSubscribeTarget] = useState<EnrichedSourceMarket | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);

  // ── Cache ─────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: cacheStatus } = trpc.source.cacheStatus.useQuery();

  const refreshCache = async () => {
    try {
      await ensureAuthenticated();
      setIsRefreshing(true);
      await backendFetch('/api/limitless/refresh-cache', { method: 'POST' });
      void utils.source.list.invalidate();
      void utils.source.cacheStatus.invalidate();
    } catch (err) {
      console.error('Failed to refresh cache:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isSemanticMode = semanticQuery.length > 0;

  // ── Browse query ──────────────────────────────────────────
  const apiSortBy = useMemo(() => {
    if (sort === "volume") return "volume";
    if (sort === "liquidity") return "liquidity";
    if (sort === "expiration") return "expiry";
    return "newest";
  }, [sort]);

  const { data: browseData, isLoading: browseLoading, error: browseError } =
    trpc.source.list.useQuery(
      { limit: PAGE_SIZE, page, sortBy: apiSortBy, tradeType: tradeType === "all" ? undefined : tradeType },
      { enabled: !isSemanticMode }
    );

  // ── Semantic search query ─────────────────────────────────
  const { data: searchData, isLoading: searchLoading, error: searchError } =
    trpc.source.search.useQuery(
      { query: semanticQuery, limit: 20 },
      { enabled: isSemanticMode }
    );

  // ── Derived values ────────────────────────────────────────
  const browseMarkets = browseData?.markets ?? [];
  const total = browseData?.total ?? 0;

  const browseFiltered = useMemo(() => {
    if (!search) return browseMarkets;
    const q = search.toLowerCase();
    return browseMarkets.filter((m) => m.title.toLowerCase().includes(q));
  }, [browseMarkets, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const searchMarkets = searchData?.markets ?? [];

  // ── Handlers ──────────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === "search") setSearch(value);
    if (key === "tradeType") setTradeType(value as TradeTypeFilter);
    if (key === "sort") setSort(value as SortKey);
  };

  const handleExpirationSort = () => {
    setPage(1);
    setSort("expiration");
  };

  const handleSemanticSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = semanticInput.trim();
    if (q) setSemanticQuery(q);
  };

  const handleSemanticClear = () => {
    setSemanticQuery("");
    setSemanticInput("");
    semanticInputRef.current?.focus();
  };

  const handleCreateMarket = (event: CreateMarketEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleSubscribe = (market: EnrichedSourceMarket) => {
    setSubscribeTarget(market);
    setSubscribeDialogOpen(true);
  };

  const isLoading = isSemanticMode ? searchLoading : browseLoading;
  const error = isSemanticMode ? searchError : browseError;
  const activeMarkets = isSemanticMode ? searchMarkets : browseFiltered;

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">

          {/* Page heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Source Markets
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {cacheStatus
                  ? `Cached ${cacheStatus.totalCount} markets · last synced ${formatRelativeTime(cacheStatus.updatedAt)}`
                  : "No cache yet — click Sync to load all markets."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => void refreshCache()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Syncing…" : "Sync Markets"}
            </Button>
          </div>

          {/* Stat cards */}
          {browseLoading && !isSemanticMode ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARD_SKELETON_KEYS.map((key) => (
                <Card key={key} className="bg-card border-border p-6 animate-pulse">
                  <div className="h-8 w-12 bg-secondary rounded mb-2" />
                  <div className="h-4 w-28 bg-secondary rounded mb-1" />
                  <div className="h-3 w-36 bg-secondary rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <StatCards total={total} />
          )}

          {/* ── Semantic search bar ── */}
          <form onSubmit={handleSemanticSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={semanticInputRef}
                value={semanticInput}
                onChange={(e) => setSemanticInput(e.target.value)}
                placeholder="Describe what you're looking for… e.g. AI regulation markets with high volume"
                className="pl-9 pr-4 h-10 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 px-4 text-sm bg-foreground text-background hover:bg-foreground/90 shrink-0"
              disabled={!semanticInput.trim() || searchLoading}
            >
              {searchLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Search</span>
            </Button>
            {isSemanticMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 text-sm border-border text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleSemanticClear}
              >
                <X className="h-3.5 w-3.5" />
                <span className="ml-1.5">Clear</span>
              </Button>
            )}
          </form>

          {/* ── Active search badge ── */}
          {isSemanticMode && (
            <div className="flex items-center gap-2 -mt-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing semantic results for{" "}
                <span className="font-medium text-foreground">"{semanticQuery}"</span>
                {!searchLoading && (
                  <> — {searchMarkets.length} market{searchMarkets.length !== 1 ? "s" : ""} found</>
                )}
              </p>
            </div>
          )}

          {/* ── Browse filters (hidden in semantic mode) ── */}
          {!isSemanticMode && (
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Filter by title…"
                  value={search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-8 h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Select value={tradeType} onValueChange={(v) => handleFilterChange("tradeType", v)}>
                <SelectTrigger className="h-8 w-36 text-xs bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Trade Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  <SelectItem value="amm" className="text-xs">AMM</SelectItem>
                  <SelectItem value="clob" className="text-xs">CLOB</SelectItem>
                  <SelectItem value="group" className="text-xs">Group</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => handleFilterChange("sort", v)}>
                <SelectTrigger className="h-8 w-44 text-xs bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="newest" className="text-xs">Newest</SelectItem>
                  <SelectItem value="volume" className="text-xs">Volume (High→Low)</SelectItem>
                  <SelectItem value="liquidity" className="text-xs">Liquidity (High→Low)</SelectItem>
                  <SelectItem value="expiration" className="text-xs">Expiration (Soonest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Content ── */}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isSemanticMode ? "Searching markets…" : "Loading markets from Source…"}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-red-400">Failed to load markets</p>
              <p className="text-xs text-red-400/70">{error.message}</p>
            </div>
          ) : activeMarkets.length === 0 ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm font-medium text-foreground">
                {isSemanticMode ? "No matching markets found" : "No markets match your filters"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSemanticMode
                  ? "Try rephrasing your query or lowering the similarity threshold."
                  : "Try adjusting the type filter or clearing the search."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-border text-muted-foreground hover:text-foreground mt-2"
                onClick={isSemanticMode ? handleSemanticClear : () => {
                  setSearch("");
                  setTradeType("all");
                  setSort("newest");
                  setPage(1);
                }}
              >
                {isSemanticMode ? "Clear search" : "Clear filters"}
              </Button>
            </div>
          ) : (
            <SourceMarketsTable
              markets={activeMarkets}
              onCreateMarket={handleCreateMarket}
              onSubscribe={handleSubscribe}
              isSortedByExpiration={!isSemanticMode && sort === "expiration"}
              onSortByExpiration={!isSemanticMode ? handleExpirationSort : undefined}
            />
          )}

          {/* ── Pagination (browse mode only) ── */}
          {!isSemanticMode && total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {startItem}–{endItem} of {total} markets
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateMarketDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <SubscribeDialog
        market={subscribeTarget}
        open={subscribeDialogOpen}
        onOpenChange={setSubscribeDialogOpen}
      />
    </>
  );
}
