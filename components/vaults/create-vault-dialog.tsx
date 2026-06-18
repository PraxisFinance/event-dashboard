"use client";

import { useState } from "react";
import {
  getVaultUsdcAddress,
  getVaultMorphoVaultAddress,
  getVaultTreasuryAddress,
} from "@/lib/praxis-vaults";
import {
  getPraxisRegistryAddress,
} from "@/lib/praxis-registry";
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
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { isAddress } from "viem";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";

interface CreateVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function CreateVaultDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateVaultDialogProps) {
  const [usdc, setUsdc] = useState(() => getVaultUsdcAddress() ?? "");
  const [morphoVault, setMorphoVault] = useState(
    () => getVaultMorphoVaultAddress() ?? "",
  );
  const [maturityInput, setMaturityInput] = useState(() =>
    toDatetimeLocal(new Date(Date.now() + ONE_WEEK_MS)),
  );
  const [treasury, setTreasury] = useState(
    () => getVaultTreasuryAddress() ?? "",
  );
  const [startTimeInput, setStartTimeInput] = useState(() =>
    toDatetimeLocal(new Date()),
  );
  const [endTimeInput, setEndTimeInput] = useState(() =>
    toDatetimeLocal(new Date(Date.now() + ONE_WEEK_MS)),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { ensureAuthenticated } = useBackendAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ vault?: string; cpf?: string; txHash?: string } | null>(null);

  const praxisRegistryAddress = getPraxisRegistryAddress();

  const missingEnv = [
    !praxisRegistryAddress && "praxisRegistry (config/contracts.ts)",
  ].filter(Boolean) as string[];

  const canSubmit =
    missingEnv.length === 0 &&
    isAddress(usdc) &&
    isAddress(morphoVault) &&
    isAddress(treasury) &&
    !isLoading;

  const handleClose = (nextOpen: boolean) => {
    if (isLoading) return;
    if (!nextOpen) {
      setError(null);
      setIsSuccess(false);
      setResult(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDeploy = async () => {
    setError(null);

    try {
      if (!praxisRegistryAddress)
        throw new Error("Missing praxisRegistry in config/contracts.ts");
      if (!isAddress(usdc)) throw new Error("Invalid USDC address");
      if (!isAddress(morphoVault))
        throw new Error("Invalid Morpho vault address");
      if (!isAddress(treasury)) throw new Error("Invalid treasury address");

      const maturityTs = Math.floor(new Date(maturityInput).getTime() / 1000);
      if (Number.isNaN(maturityTs) || maturityTs <= Math.floor(Date.now() / 1000))
        throw new Error("Maturity must be in the future.");

      const startTs = Math.floor(new Date(startTimeInput).getTime() / 1000);
      const endTs = Math.floor(new Date(endTimeInput).getTime() / 1000);
      if (Number.isNaN(endTs) || endTs <= startTs)
        throw new Error("CPF end time must be after start time.");

      await ensureAuthenticated();
      setIsLoading(true);

      const deployResult = await backendFetch<{ vault?: string; cpf?: string; txHash?: string }>(
        '/vaults/deploy',
        {
          method: 'POST',
          body: JSON.stringify({ usdc, morphoVault, maturityTs, treasury, startTs, endTs }),
        },
      );

      setResult(deployResult);
      setIsSuccess(true);
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
            Deploy Vault + CPF
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
            <p className="text-sm font-medium text-foreground">
              Both contracts deployed!
            </p>
            {result?.vault && (
              <a
                href={`https://sepolia.basescan.org/address/${result.vault}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Vault: {result.vault.slice(0, 10)}…{result.vault.slice(-8)}
              </a>
            )}
            {result?.cpf && (
              <a
                href={`https://sepolia.basescan.org/address/${result.cpf}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                CPF: {result.cpf.slice(0, 10)}…{result.cpf.slice(-8)}
              </a>
            )}
            {result?.txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Tx: {result.txHash.slice(0, 10)}…{result.txHash.slice(-8)}
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border mt-2"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            {missingEnv.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-900/40 bg-yellow-950/20 px-3 py-2.5 text-xs text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium mb-1">
                    Missing environment variables:
                  </p>
                  {missingEnv.map((v) => (
                    <p key={v} className="font-mono">
                      {v}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5 py-1">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Vault
                </p>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">USDC Address *</Label>
                  <Input
                    value={usdc}
                    onChange={(e) => setUsdc(e.target.value)}
                    placeholder="0x…"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Morpho Vault Address *
                  </Label>
                  <Input
                    value={morphoVault}
                    onChange={(e) => setMorphoVault(e.target.value)}
                    placeholder="0x…"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Maturity</Label>
                  <Input
                    type="datetime-local"
                    value={maturityInput}
                    onChange={(e) => setMaturityInput(e.target.value)}
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  CPF
                </p>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Treasury Address *
                  </Label>
                  <Input
                    value={treasury}
                    onChange={(e) => setTreasury(e.target.value)}
                    placeholder="0x…"
                    className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="h-8 text-xs bg-secondary border-border text-foreground"
                      disabled={isLoading}
                    />
                  </div>
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
              </div>
            </div>

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
                  "Deploy"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
