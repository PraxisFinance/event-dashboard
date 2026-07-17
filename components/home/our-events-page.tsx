"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { FilterBar, type FilterState } from "@/components/home/filter-bar";
import { EventsTable } from "@/components/home/events-table";
import { CreateMarketDialog } from "@/components/markets/create-market-dialog";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import { StatCards } from "@/components/home/stat-cards";
import { type PredictionEvent } from "@/lib/mock-data";
import { mapDbEventToPredictionEvent } from "@/lib/map-db-event";
import { trpc } from "@/lib/trpc/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

/** True when expirationTimestamp is set and still in the future (seconds or ms). */
function isNotExpired(event: PredictionEvent, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const ts = event.expirationTimestamp;
  if (ts == null) return false;
  const sec = ts > 1e10 ? Math.floor(ts / 1000) : ts;
  return sec > nowSec;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border p-6 space-y-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full max-w-[180px]" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-[320px] w-full rounded-lg" />
    </div>
  );
}

export function OurEventsPage() {
  const { status } = useSession();
  const utils = trpc.useUtils();

  const { data, isLoading, isError, error } = trpc.events.list.useQuery(
    {},
    { enabled: status === "authenticated" }
  );

  const praxisEvents = useMemo(
    () => (data ?? []).map(mapDbEventToPredictionEvent),
    [data]
  );

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    platform: "all",
    expiry: "active",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<PredictionEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const nonExpiredEvents = useMemo(
    () => praxisEvents.filter((e) => isNotExpired(e)),
    [praxisEvents]
  );

  const filtered = useMemo(() => {
    let result = [...praxisEvents];

    if (filters.expiry === "active") {
      result = result.filter((e) => isNotExpired(e));
    } else if (filters.expiry === "expired") {
      result = result.filter((e) => !isNotExpired(e));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (filters.status !== "all") {
      result = result.filter((e) => e.status === filters.status);
    }
    if (filters.platform === "on") {
      result = result.filter((e) => e.onPlatform);
    } else if (filters.platform === "off") {
      result = result.filter((e) => !e.onPlatform);
    }

    if (filters.sort === "expiration") {
      result.sort(
        (a, b) => (a.expirationTimestamp ?? 0) - (b.expirationTimestamp ?? 0)
      );
    } else {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [filters, praxisEvents]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleCreateMarket = (event: PredictionEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const startItem = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filtered.length);

  const showAuthGate = status === "unauthenticated";
  const showLoading = status === "loading" || (status === "authenticated" && isLoading);

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Our Events</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Praxis-native prediction market events and their on-chain deployment status.
            </p>
          </div>

          {showAuthGate ? (
            <Card className="bg-card border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in with your wallet to load Praxis events from the database.
              </p>
            </Card>
          ) : showLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <Card className="bg-card border-border p-8 text-center">
              <p className="text-sm text-red-400">
                {error?.message ?? "Could not load events."}
              </p>
            </Card>
          ) : (
            <>
              <StatCards events={nonExpiredEvents} />

              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                hideSourceFilter
              />

              <EventsTable events={paginated} onCreateMarket={handleCreateMarket} />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {filtered.length === 0
                    ? "No events found"
                    : `Showing ${startItem}–${endItem} of ${filtered.length} events`}
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
                    {page} / {Math.max(1, totalPages)}
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
            </>
          )}
        </div>
      </main>

      <CreateMarketDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPromoted={() => void utils.events.list.invalidate()}
      />
    </>
  );
}
