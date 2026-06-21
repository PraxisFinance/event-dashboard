"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { CreateMarketDialog } from "@/components/markets/create-market-dialog";
import { EditEventMetadataDialog } from "@/components/markets/edit-event-metadata-dialog";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import {
  formatDate,
  formatDateTime,
  formatTimestamp,
  truncateHash,
} from "@/lib/mock-data";
import { mapDbEventToPredictionEvent } from "@/lib/map-db-event";
import { trpc } from "@/lib/trpc/react";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Link2,
  Calendar,
  Clock,
  Tag,
  Pencil,
} from "lucide-react";
import type { PredictionEvent } from "@/lib/mock-data";

// ─── Small presentational components ─────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "open")
    return (
      <Badge className="bg-brand-green/15 text-brand-green border-brand-green/30 text-xs font-medium">
        Open
      </Badge>
    );
  if (status === "resolved")
    return (
      <Badge className="bg-secondary text-muted-foreground border-border text-xs font-medium">
        Resolved
      </Badge>
    );
  return (
    <Badge className="bg-brand-red/15 text-brand-red border-brand-red/30 text-xs font-medium">
      Cancelled
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "source")
    return (
      <Badge className="bg-brand-blue/15 text-brand-blue border-brand-blue/30 text-xs font-medium">
        Source
      </Badge>
    );
  return (
    <Badge className="bg-brand-purple/15 text-brand-purple border-brand-purple/30 text-xs font-medium">
      Praxis
    </Badge>
  );
}

function TimelineRow({
  icon,
  label,
  value,
  valueClass = "text-foreground",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        {icon}
        {label}
      </div>
      <p className={`text-xs font-medium ${valueClass} text-right`}>{value}</p>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full max-w-2xl" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

function EventHeader({ event }: { event: PredictionEvent }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-foreground leading-snug text-balance">
        {event.title}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={event.status} />
        <SourceBadge source={event.source} />
        {event.onPlatform && (
          <>
            <Badge className="bg-brand-green/15 text-brand-green border-brand-green/30 text-xs font-medium">
              On Platform
            </Badge>
            {event.contractTxHash && (
              <a
                href={`https://basescan.org/tx/${event.contractTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                {truncateHash(event.contractTxHash)}
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DescriptionCard({ event }: { event: PredictionEvent }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
      </CardContent>
    </Card>
  );
}

function MarketInfoCard({ event }: { event: PredictionEvent }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Market Info
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Expiration
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatTimestamp(event.expirationTimestamp)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Market Type</p>
            <p className="text-sm font-medium text-foreground">{event.marketType ?? "—"}</p>
          </div>
        </div>

        {event.slug && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Slug</p>
            <p className="font-mono text-xs text-foreground bg-secondary px-2 py-1.5 rounded border border-border">
              {event.slug}
            </p>
          </div>
        )}

        {event.categories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {event.categories.map((c) => (
                <Badge
                  key={c}
                  className="bg-secondary text-muted-foreground border-border text-xs font-normal"
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.tags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((t) => (
                <Badge
                  key={t}
                  className="bg-secondary/60 text-muted-foreground border-border text-xs font-normal"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventTimelineCard({ event }: { event: PredictionEvent }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <TimelineRow
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Created"
            value={formatDate(event.createdAt)}
          />
          <TimelineRow
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Last Synced"
            value={event.syncedAt ? formatDateTime(event.syncedAt) : "Never"}
          />
          <TimelineRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Imported to Platform"
            value={event.onPlatform ? formatDate(event.updatedAt) : "Not yet"}
            valueClass={event.onPlatform ? "text-foreground" : "text-muted-foreground"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EventActionsCard({
  event,
  onEditMeta,
  onCreateMarket,
}: {
  event: PredictionEvent;
  onEditMeta: () => void;
  onCreateMarket: () => void;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full gap-1.5 border-border text-muted-foreground hover:text-foreground"
          onClick={onEditMeta}
        >
          <Pencil className="h-4 w-4" />
          Edit Metadata
        </Button>

        {event.onPlatform ? (
          <>
            {event.contractTxHash && (
              <Button
                variant="outline"
                className="w-full gap-1.5 border-border text-muted-foreground hover:text-foreground"
                asChild
              >
                <a
                  href={`https://basescan.org/tx/${event.contractTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on BaseScan
                </a>
              </Button>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contract Event ID</p>
                <p className="font-mono text-xs text-foreground bg-secondary px-2 py-1.5 rounded border border-border break-all">
                  {event.contractEventId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <p className="font-mono text-xs text-foreground bg-secondary px-2 py-1.5 rounded border border-border break-all">
                  {event.contractTxHash ? truncateHash(event.contractTxHash) : "—"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <Button
            className="w-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            onClick={onCreateMarket}
          >
            <Link2 className="h-4 w-4" />
            Create on Platform
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SyncInfoCard({ event }: { event: PredictionEvent }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Sync Info
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Source ID</p>
            <p className="font-mono text-xs text-foreground bg-secondary px-2 py-1.5 rounded border border-border">
              {event.sourceId ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Synced</p>
            <p className="text-sm text-foreground">
              {event.syncedAt ? formatDateTime(event.syncedAt) : "Never"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync This Event
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page states ──────────────────────────────────────────────────────────────

function AuthGate() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6">
          <Card className="bg-card border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with your wallet to view this event from the database.
            </p>
          </Card>
        </div>
      </main>
    </>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6">
          <Card className="bg-card border-border p-8 text-center">
            <p className="text-sm text-red-400">{message}</p>
          </Card>
        </div>
      </main>
    </>
  );
}

function LoadingState() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <EventDetailSkeleton />
      </main>
    </>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMetaOpen, setEditMetaOpen] = useState(false);

  const { data: row, isLoading, isError, error } = trpc.events.byId.useQuery(
    { id },
    { enabled: status === "authenticated" && Boolean(id) },
  );

  const event = useMemo(() => (row ? mapDbEventToPredictionEvent(row) : null), [row]);

  if (status === "unauthenticated") return <AuthGate />;
  if (status === "loading" || (status === "authenticated" && isLoading)) return <LoadingState />;
  if (status === "authenticated" && isError)
    return <ErrorState message={error?.message ?? "Could not load event."} />;
  if (status === "authenticated" && row == null) notFound();
  if (!event) return <LoadingState />;

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
          <Link
            href={event.source === "source" ? "/source" : "/"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            {event.source === "source" ? "Back to Source Events" : "Back to Our Events"}
          </Link>

          <EventHeader event={event} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <DescriptionCard event={event} />
              <MarketInfoCard event={event} />
              <EventTimelineCard event={event} />
            </div>
            <div className="flex flex-col gap-6">
              <EventActionsCard
                event={event}
                onEditMeta={() => setEditMetaOpen(true)}
                onCreateMarket={() => setDialogOpen(true)}
              />
              <SyncInfoCard event={event} />
            </div>
          </div>
        </div>
      </main>

      <CreateMarketDialog
        event={event}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPromoted={() => {
          void utils.events.byId.invalidate({ id });
          void utils.events.list.invalidate();
        }}
      />

      <EditEventMetadataDialog
        event={event}
        open={editMetaOpen}
        onOpenChange={setEditMetaOpen}
        onSaved={() => void utils.events.byId.invalidate({ id })}
      />
    </>
  );
}
