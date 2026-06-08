"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/primitives/badge";
import { backendFetch } from "@/lib/backend";
import { useVaultStore, type SelectedVault } from "@/lib/stores/vault-store";
import type { VaultState } from "@/lib/envio";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Vault,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { CreateVaultDialog } from "@/components/vaults/create-vault-dialog";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function basescanAddr(addr: string) {
  return `https://sepolia.basescan.org/address/${addr}`;
}

function formatBigInt(raw: string, decimals = 6): string {
  try {
    const n = BigInt(raw);
    const divisor = 10n ** BigInt(decimals);
    const whole = n / divisor;
    const frac = n % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole.toLocaleString()}.${fracStr}`;
  } catch {
    return raw;
  }
}

function VaultCard({
  vault,
  isSelected,
  onSelect,
}: {
  vault: VaultState;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const maturityDate = new Date(Number(vault.maturity) * 1000);
  const lastUpdated = new Date(Number(vault.lastUpdatedAt) * 1000);
  const isExpired = maturityDate < new Date();

  return (
    <Card
      className={`bg-card border p-5 flex flex-col gap-4 transition-colors ${
        isSelected
          ? "border-brand-green/60 ring-1 ring-brand-green/30"
          : "border-border hover:border-border/80"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={basescanAddr(vault.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm font-medium text-foreground hover:text-brand-green transition-colors flex items-center gap-1"
            >
              {shortAddr(vault.id)}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>

            {vault.isPaused && (
              <Badge className="bg-red-950/40 text-red-400 border-red-900/40 text-xs font-normal">
                Paused
              </Badge>
            )}
            {isExpired ? (
              <Badge className="bg-secondary text-muted-foreground border-border text-xs font-normal">
                Expired
              </Badge>
            ) : (
              <Badge className="bg-brand-green/10 text-brand-green border-brand-green/20 text-xs font-normal">
                Active
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Matures{" "}
            {isExpired
              ? `${formatDistanceToNow(maturityDate)} ago`
              : `in ${formatDistanceToNow(maturityDate)}`}{" "}
            · {maturityDate.toLocaleDateString()}
          </p>
        </div>

        <Button
          size="sm"
          variant={isSelected ? "outline" : "default"}
          className={
            isSelected
              ? "h-8 text-xs border-brand-green/40 text-brand-green hover:bg-brand-green/10 shrink-0 gap-1.5"
              : "h-8 text-xs bg-foreground text-background hover:bg-foreground/90 shrink-0"
          }
          onClick={onSelect}
        >
          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>

      {/* Token addresses */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">PT</span>
          <a
            href={basescanAddr(vault.pt)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-foreground hover:text-brand-green transition-colors flex items-center gap-1"
          >
            {shortAddr(vault.pt)}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </a>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">YT</span>
          <a
            href={basescanAddr(vault.yt)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-foreground hover:text-brand-green transition-colors flex items-center gap-1"
          >
            {shortAddr(vault.yt)}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-border">
        <Stat
          label="Total Balance"
          value={`${formatBigInt(vault.totalBalance)} PT`}
        />
        <Stat
          label="Total Deposited"
          value={`${formatBigInt(vault.totalDeposited)} USDC`}
        />
        <Stat
          label="Yield Paid"
          value={`${formatBigInt(vault.totalYieldPaid)} YT`}
        />
        <Stat label="Depositors" value={vault.uniqueDepositors.toString()} />
        <Stat
          label="Last Updated"
          value={formatDistanceToNow(lastUpdated, { addSuffix: true })}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Owner</span>
          <a
            href={basescanAddr(vault.owner)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-foreground hover:text-brand-green transition-colors flex items-center gap-1"
          >
            {shortAddr(vault.owner)}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-xs font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function VaultsPage() {
  const [data, setData] = useState<VaultState[] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVaults = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await backendFetch<VaultState[]>('/vaults');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchVaults();
  }, [fetchVaults]);

  const refetch = fetchVaults;

  const { selectedVault, setSelectedVault } = useVaultStore();
  const [createOpen, setCreateOpen] = useState(false);

  const vaults = data ?? [];

  const handleSelect = (vault: VaultState) => {
    const next: SelectedVault = {
      id: vault.id,
      pt: vault.pt,
      yt: vault.yt,
      maturity: vault.maturity,
      isPaused: vault.isPaused,
      owner: vault.owner,
    };
    if (selectedVault?.id === vault.id) {
      setSelectedVault(null);
    } else {
      setSelectedVault(next);
    }
  };

  return (
    <>
      <CreateVaultDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch()}
      />
      <Header />
      <main className="pt-14 min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
          {/* Heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Vaults</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Praxis vaults indexed via Envio. Select one to use as the
                default in RYD and Two-Pool deployments.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Deploy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Selected vault banner */}
          {selectedVault && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-green/30 bg-brand-green/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Active vault
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {selectedVault.id}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedVault(null)}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {vaults.length}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Total Vaults
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Indexed from chain
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {
                    vaults.filter(
                      (v) =>
                        !v.isPaused && Number(v.maturity) * 1000 > Date.now(),
                    ).length
                  }
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Not paused, not expired
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              {isLoading ? (
                <div className="h-8 w-12 bg-secondary rounded mb-2 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {vaults
                    .reduce((s, v) => s + v.uniqueDepositors, 0)
                    .toLocaleString()}
                </p>
              )}
              <p className="text-sm font-medium text-foreground mt-1">
                Depositors
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unique across all vaults
              </p>
            </Card>
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 h-8">
                <Vault className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mt-1">
                Envio Indexed
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time state
              </p>
            </Card>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading vaults from indexer…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-red-400">
                Failed to load vaults
              </p>
              <p className="text-xs text-red-400/70">{error.message}</p>
              {error.message.includes("ENVIO_INDEXER_URL") && (
                <p className="text-xs text-red-400/50 mt-1">
                  Set <code className="font-mono">ENVIO_INDEXER_URL</code> in
                  your environment.
                </p>
              )}
            </div>
          ) : vaults.length === 0 ? (
            <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm font-medium text-foreground">
                No vaults indexed yet
              </p>
              <p className="text-xs text-muted-foreground">
                The Envio indexer returned an empty result.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  isSelected={selectedVault?.id === vault.id}
                  onSelect={() => handleSelect(vault)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
