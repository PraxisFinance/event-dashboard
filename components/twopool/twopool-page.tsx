"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { TwoPoolTable } from "@/components/twopool/twopool-table";
import { CreateTwoPoolDialog } from "@/components/twopool/create-twopool-dialog";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { trpc } from "@/lib/trpc/react";
import { Loader2, Plus, TrendingUp } from "lucide-react";

export function TwoPoolPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = trpc.twopool.list.useQuery();

  const rows = data ?? [];
  const now = new Date();
  const active = rows.filter((r) => new Date(r.startTime) <= now && new Date(r.endTime) > now);
  const pending = rows.filter((r) => new Date(r.startTime) > now);

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">

          {/* Heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Two-Pool Campaigns
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Deployed PraxisTwoPool contracts managed by the registry.
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 shrink-0"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Deploy Two-Pool
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">{rows.length}</p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Total Deployed</p>
              <p className="text-xs text-muted-foreground mt-0.5">All two-pool contracts</p>
            </Card>

            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">{active.length}</p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">Currently running</p>
            </Card>

            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">{pending.length}</p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">Not yet started</p>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 h-8">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mt-1">Yield Pools</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fixed-rate AMM campaigns</p>
            </Card>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading two-pool contracts…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-red-400">Failed to load contracts</p>
              <p className="text-xs text-red-400/70">{error.message}</p>
            </div>
          ) : (
            <TwoPoolTable rows={rows} />
          )}
        </div>
      </main>

      <CreateTwoPoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          setDialogOpen(false);
          refetch();
        }}
      />
    </>
  );
}
