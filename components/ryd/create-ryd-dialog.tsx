"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Textarea } from "@/components/ui/primitives/textarea";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { isAddress } from "viem";
import { useVaultStore } from "@/lib/stores/vault-store";
import Link from "next/link";

interface CreateRydDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const DEFAULT_END_TIME = toDatetimeLocal(
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
);

export function CreateRydDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateRydDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [numWinners, setNumWinners] = useState("1");
  const [minDepositUsdc, setMinDepositUsdc] = useState("0.01");
  const [endTimeInput, setEndTimeInput] = useState(DEFAULT_END_TIME);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();

  const { selectedVault } = useVaultStore();
  const vaultAddress = (selectedVault?.id ?? "") as string;
  const noVault = !vaultAddress || !isAddress(vaultAddress);

  const canSubmit =
    !noVault && name.trim().length > 0 && !isLoading;

  const handleClose = (nextOpen: boolean) => {
    if (isLoading) return;
    if (!nextOpen) {
      setError(null);
      setIsSuccess(false);
      setTxHash(undefined);
    }
    onOpenChange(nextOpen);
  };

  const handleDeploy = async () => {
    setError(null);

    try {
      if (!vaultAddress || !isAddress(vaultAddress))
        throw new Error("No vault selected. Pick one on the Vaults page.");
      if (!name.trim()) throw new Error("Name is required.");

      const winners = parseInt(numWinners, 10);
      if (!winners || winners < 1)
        throw new Error("Number of winners must be \u2265 1.");

      const endTs = Math.floor(new Date(endTimeInput).getTime() / 1000);
      if (Number.isNaN(endTs) || endTs <= Math.floor(Date.now() / 1000))
        throw new Error("End time must be in the future.");

      await ensureAuthenticated();
      setIsLoading(true);

      const result = await backendFetch<{ txHash: string; rydAddress: string }>(
        '/ryd/deploy',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            vaultAddress,
            numWinners: winners,
            minDepositUsdc: minDepositUsdc || "0",
            endTs,
          }),
        },
      );

      setTxHash(result.txHash);
      setIsSuccess(true);
      void utils.ryd.list.invalidate();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const explorerUrl = txHash
    ? `https://sepolia.basescan.org/tx/${txHash}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Deploy Random Yield Distribution
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
            <p className="text-sm font-medium text-foreground">RYD Deployed!</p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View on BaseScan
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            {noVault && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-900/40 bg-yellow-950/20 px-3 py-2.5 text-xs text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  No vault selected.{" "}
                  <Link
                    href="/vaults"
                    className="underline hover:text-yellow-300"
                  >
                    Pick one on the Vaults page
                  </Link>{" "}
                  first.
                </span>
              </div>
            )}

            {/* Vault preview */}
            {!noVault && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Vault:</span>
                <span className="font-mono text-foreground">
                  {vaultAddress.slice(0, 10)}…{vaultAddress.slice(-8)}
                </span>
                {selectedVault && (
                  <span className="text-muted-foreground ml-auto">
                    YT: {selectedVault.yt.slice(0, 6)}…
                    {selectedVault.yt.slice(-4)}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4 py-1">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q2 2026 Yield Round"
                  className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for this RYD contract…"
                  className="text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none h-20"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Num Winners */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Winners</Label>
                  <Input
                    type="number"
                    min="1"
                    value={numWinners}
                    onChange={(e) => setNumWinners(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                    disabled={isLoading}
                  />
                </div>

                {/* Min Deposit */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Min Deposit (USDC)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={minDepositUsdc}
                    onChange={(e) => setMinDepositUsdc(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">End Time</Label>
                <Input
                  type="datetime-local"
                  value={endTimeInput}
                  onChange={(e) => setEndTimeInput(e.target.value)}
                  className="h-8 text-xs bg-secondary border-border text-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Status row */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deploying via backend wallet — please wait…
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border text-muted-foreground"
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
                onClick={handleDeploy}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Deploy RYD"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
