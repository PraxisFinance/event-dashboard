"use client";

import { useState } from "react";
import {
  getTwoPoolDefaultCurveAddress,
  getTwoPoolDefaultAlpha,
  getTwoPoolDefaultFeePercentage,
  getTwoPoolDefaultSeedAmount,
  getTwoPoolDefaultTreasury,
} from "@/lib/praxis-twopools";
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

interface CreateTwoPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const MIN_START_OFFSET_MS = 5 * 60 * 1000;

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function defaultStart() {
  return toDatetimeLocal(new Date(Date.now() + 5 * 60 * 1000));
}

function defaultEnd() {
  return toDatetimeLocal(
    new Date(Date.now() + 5 * 60 * 1000 + 90 * 24 * 60 * 60 * 1000),
  );
}

export function CreateTwoPoolDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTwoPoolDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { selectedVault } = useVaultStore();

  const [vault, setVault] = useState(() => selectedVault?.id ?? "");
  const [curve, setCurve] = useState(getTwoPoolDefaultCurveAddress() ?? "");
  const [targetRateInput, setTargetRateInput] = useState("1000000000000000000");
  const [startTimeInput, setStartTimeInput] = useState(defaultStart);
  const [endTimeInput, setEndTimeInput] = useState(defaultEnd);
  const [alphaInput, setAlphaInput] = useState(getTwoPoolDefaultAlpha());
  const [treasuryInput, setTreasuryInput] = useState(
    getTwoPoolDefaultTreasury() ?? "",
  );
  const [feePercentageInput, setFeePercentageInput] = useState(
    getTwoPoolDefaultFeePercentage(),
  );
  const [initialLiquidityYtInput, setInitialLiquidityYtInput] = useState(
    getTwoPoolDefaultSeedAmount(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();

  const startTs = startTimeInput ? new Date(startTimeInput).getTime() : NaN;
  const startTimeError =
    !Number.isNaN(startTs) && startTs < Date.now() + MIN_START_OFFSET_MS
      ? "Start time must be at least 5 minutes from now."
      : null;

  const canSubmit =
    name.trim().length > 0 &&
    isAddress(vault) &&
    isAddress(curve) &&
    isAddress(treasuryInput) &&
    !startTimeError &&
    !isLoading;

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
      if (!isAddress(vault)) throw new Error("Vault must be a valid address.");
      if (!isAddress(curve)) throw new Error("Curve must be a valid address.");
      if (!isAddress(treasuryInput))
        throw new Error("Treasury must be a valid address.");
      if (!name.trim()) throw new Error("Name is required.");

      try {
        BigInt(targetRateInput.trim());
      } catch {
        throw new Error("Target rate must be a valid integer (uint256).");
      }

      try {
        BigInt(alphaInput.trim());
      } catch {
        throw new Error("Alpha must be a valid integer (uint256).");
      }

      try {
        BigInt(feePercentageInput.trim());
      } catch {
        throw new Error("Fee percentage must be a valid integer (uint256).");
      }

      try {
        BigInt(initialLiquidityYtInput.trim());
      } catch {
        throw new Error("Initial liquidity must be a valid integer (uint256).");
      }

      const startTs = Math.floor(new Date(startTimeInput).getTime() / 1000);
      const endTs = Math.floor(new Date(endTimeInput).getTime() / 1000);
      if (Number.isNaN(startTs)) throw new Error("Invalid start time.");
      if (Number.isNaN(endTs)) throw new Error("Invalid end time.");
      if (endTs <= startTs)
        throw new Error("End time must be after start time.");

      await ensureAuthenticated();
      setIsLoading(true);

      const result = await backendFetch<{
        txHash: string;
        poolAddress: string;
        ytAddress?: string;
      }>("/twopools/deploy", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          vaultAddress: vault,
          curveAddress: curve,
          targetRate: targetRateInput.trim(),
          startTs,
          endTs,
          alpha: alphaInput.trim(),
          treasury: treasuryInput.trim(),
          feePercentage: feePercentageInput.trim(),
          initialLiquidityYt: initialLiquidityYtInput.trim(),
        }),
      });

      setTxHash(result.txHash);
      setIsSuccess(true);
      void utils.twopool.list.invalidate();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Deploy Two-Pool Campaign
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
            <p className="text-sm font-medium text-foreground">
              Two-Pool Deployed & Seeded!
            </p>
            {txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${txHash}`}
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
            <div className="flex flex-col gap-4 py-1">
              {/* Off-chain */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Off-chain metadata
              </p>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. USDC Yield Pool Q3 2026"
                  className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description…"
                  className="text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none h-16"
                  disabled={isLoading}
                />
              </div>

              {/* On-chain */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                On-chain parameters
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Vault address *</Label>
                  <Input
                    value={vault}
                    onChange={(e) => setVault(e.target.value)}
                    placeholder="0x…"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  {vault && !isAddress(vault) && (
                    <p className="text-xs text-red-400">Invalid address</p>
                  )}
                  {!vault && !selectedVault && (
                    <p className="text-xs text-muted-foreground">
                      <Link
                        href="/vaults"
                        className="underline hover:text-foreground"
                      >
                        Select a vault
                      </Link>{" "}
                      to auto-fill.
                    </p>
                  )}
                  {selectedVault && vault === selectedVault.id && (
                    <p className="text-xs text-muted-foreground">
                      Pre-filled from selected vault
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Curve address *</Label>
                  <Input
                    value={curve}
                    onChange={(e) => setCurve(e.target.value)}
                    placeholder="0x…"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  {curve && !isAddress(curve) && (
                    <p className="text-xs text-red-400">Invalid address</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  Treasury address *{" "}
                  <span className="font-normal text-muted-foreground">
                    (receives protocol fees)
                  </span>
                </Label>
                <Input
                  value={treasuryInput}
                  onChange={(e) => setTreasuryInput(e.target.value)}
                  placeholder="0x…"
                  className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                {treasuryInput && !isAddress(treasuryInput) && (
                  <p className="text-xs text-red-400">Invalid address</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Target rate{" "}
                    <span className="font-normal text-muted-foreground">
                      (uint256)
                    </span>
                  </Label>
                  <Input
                    value={targetRateInput}
                    onChange={(e) => setTargetRateInput(e.target.value)}
                    placeholder="1000000000000000000"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Alpha{" "}
                    <span className="font-normal text-muted-foreground">
                      (uint256)
                    </span>
                  </Label>
                  <Input
                    value={alphaInput}
                    onChange={(e) => setAlphaInput(e.target.value)}
                    placeholder="500000000000000000"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Fee{" "}
                    <span className="font-normal text-muted-foreground">
                      (bps / 10,000)
                    </span>
                  </Label>
                  <Input
                    value={feePercentageInput}
                    onChange={(e) => setFeePercentageInput(e.target.value)}
                    placeholder="100"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">e.g. 100 = 1%</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Seed liquidity{" "}
                    <span className="font-normal text-muted-foreground">
                      (YT wei / side)
                    </span>
                  </Label>
                  <Input
                    value={initialLiquidityYtInput}
                    onChange={(e) => setInitialLiquidityYtInput(e.target.value)}
                    placeholder="1000000000000000000000"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pool receives 2× total YT
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Start time</Label>
                  <Input
                    type="datetime-local"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                    disabled={isLoading}
                  />
                  {startTimeError && (
                    <p className="text-xs text-red-400">{startTimeError}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">End time</Label>
                  <Input
                    type="datetime-local"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deploying & seeding via backend wallet — please wait…
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
                  "Deploy & Seed"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
