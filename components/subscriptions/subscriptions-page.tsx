"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/primitives/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/overlays/alert-dialog";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import {
  Bell,
  BellOff,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Subscription } from "@prisma/client";

type SubscriptionCardData = Omit<
  Subscription,
  "createdAt" | "updatedAt" | "lastTriggeredAt" | "lastDeployedMarketCreatedAt"
> & {
  createdAt: Date | string;
  updatedAt: Date | string;
  lastTriggeredAt: Date | string | null;
  lastDeployedMarketCreatedAt: Date | string | null;
};

function SubscriptionCard({
  sub,
  onDeleted,
  onToggled,
}: {
  sub: SubscriptionCardData;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const { ensureAuthenticated } = useBackendAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleRemove = async () => {
    try {
      await ensureAuthenticated();
      setIsRemoving(true);
      await backendFetch(`/api/subscriptions/${sub.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleToggle = async () => {
    try {
      await ensureAuthenticated();
      setIsToggling(true);
      await backendFetch(`/api/subscriptions/${sub.id}/toggle`, { method: 'PATCH' });
      onToggled();
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className="bg-card border border-border p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">
              {sub.title}
            </span>
            <Badge
              className={
                sub.active
                  ? "bg-brand-green/10 text-brand-green border-brand-green/20 text-xs font-normal shrink-0"
                  : "bg-secondary text-muted-foreground border-border text-xs font-normal shrink-0"
              }
            >
              {sub.active ? "Active" : "Paused"}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {sub.stableSlug}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-foreground"
            title={sub.active ? "Pause subscription" : "Resume subscription"}
            disabled={isToggling}
            onClick={() => void handleToggle()}
          >
            {isToggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : sub.active ? (
              <BellOff className="h-3.5 w-3.5" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-red-900/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/60"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {sub.title}
                  </span>{" "}
                  and stop any future auto-deploys. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => void handleRemove()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
        {sub.marketType && (
          <StatField label="Market type" value={sub.marketType} />
        )}
        {sub.resolutionTypeTuple && (
          <StatField
            label="Resolution type"
            value={sub.resolutionTypeTuple}
          />
        )}
        {sub.vault && (
          <StatField
            label="Vault"
            value={`${sub.vault.slice(0, 6)}…${sub.vault.slice(-4)}`}
          />
        )}
        {sub.cpfAddress && (
          <StatField
            label="CPF address"
            value={`${sub.cpfAddress.slice(0, 6)}…${sub.cpfAddress.slice(-4)}`}
          />
        )}
        {sub.lastDeployedSlug && (
          <StatField label="Last deployed" value={sub.lastDeployedSlug} />
        )}
        {sub.lastTriggeredAt && (
          <StatField
            label="Last triggered"
            value={formatDistanceToNow(new Date(sub.lastTriggeredAt), {
              addSuffix: true,
            })}
          />
        )}
      </div>

      {/* Tags / categories */}
      {(sub.categories.length > 0 || sub.tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
          {sub.categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-secondary text-muted-foreground border border-border"
            >
              {c}
            </span>
          ))}
          {sub.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-brand-green/5 text-brand-green border border-brand-green/20"
            >
              <Tag className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Error banner */}
      {sub.lastError && (
        <div className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2">
          <p className="text-xs text-red-400 font-medium mb-0.5">Last error</p>
          <p className="text-xs text-red-400/70 font-mono break-all">
            {sub.lastError}
          </p>
        </div>
      )}

      {/* Footer: created */}
      <p className="text-xs text-muted-foreground/60">
        Created{" "}
        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
      </p>
    </Card>
  );
}

function StatField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate">{value}</span>
    </div>
  );
}

export function SubscriptionsPage() {
  const { data, isLoading, error, refetch, isFetching } =
    trpc.subscriptions.list.useQuery();

  const subscriptions = data ?? [];
  const active = subscriptions.filter((s) => s.active).length;

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
          {/* Heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Subscriptions
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Auto-deploy rules that watch Source for new markets and
                deploy them.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {subscriptions.length}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Total
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All subscriptions
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {active}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Active
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently running
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {subscriptions.length - active}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Paused
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive subscriptions
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {subscriptions.filter((s) => s.lastError).length}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Errored
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last run failed
              </p>
            </Card>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading subscriptions…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-red-400">
                Failed to load subscriptions
              </p>
              <p className="text-xs text-red-400/70">{error.message}</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No subscriptions yet
              </p>
              <p className="text-xs text-muted-foreground">
                Subscribe to a Source market to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  onDeleted={() => refetch()}
                  onToggled={() => refetch()}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
