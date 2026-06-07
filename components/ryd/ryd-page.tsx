"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { RydTable } from "@/components/ryd/ryd-table";
import { CreateRydDialog } from "@/components/ryd/create-ryd-dialog";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { trpc } from "@/lib/trpc/react";
import { Loader2, Plus, Dices } from "lucide-react";

export function RydPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = trpc.ryd.list.useQuery();

  const rows = data ?? [];

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">

          {/* Page heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Random Yield Distribution
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Deployed RYD contracts managed by the Praxis registry.
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 shrink-0"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Deploy RYD
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {rows.length}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Total Deployed</p>
              <p className="text-xs text-muted-foreground mt-0.5">RYD contracts on-chain</p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {rows.filter((r) => new Date(r.endTime) > new Date()).length}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">End time in the future</p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {rows.reduce((sum, r) => sum + r.numWinners, 0)}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Total Winners</p>
              <p className="text-xs text-muted-foreground mt-0.5">Across all contracts</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 h-8">
                <Dices className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mt-1">Chainlink VRF</p>
              <p className="text-xs text-muted-foreground mt-0.5">Randomness source</p>
            </Card>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading RYD contracts…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-red-400">Failed to load contracts</p>
              <p className="text-xs text-red-400/70">{error.message}</p>
            </div>
          ) : (
            <RydTable rows={rows} />
          )}
        </div>
      </main>

      <CreateRydDialog
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
