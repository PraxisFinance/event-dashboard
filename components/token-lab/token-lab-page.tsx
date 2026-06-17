"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import { getVaultUsdcAddress, getVaultMorphoVaultAddress } from "@/lib/praxis-vaults";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Loader2,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import { isAddress } from "viem";
import { useState } from "react";

// ─── shared helpers ──────────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">
        {label}
        {hint && (
          <span className="ml-1 font-normal text-muted-foreground">{hint}</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2.5 text-xs text-red-400">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-brand-green/30 bg-brand-green/10 px-3 py-2.5 text-xs text-brand-green">
      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Mint section ─────────────────────────────────────────────────────────────

interface MintResult {
  txHash?: string;
  minted?: string;
}

function MintCard() {
  const defaultToken = getVaultUsdcAddress() ?? "";
  const [tokenAddress, setTokenAddress] = useState(defaultToken);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  const { ensureAuthenticated } = useBackendAuth();

  const canSubmit =
    isAddress(tokenAddress) &&
    isAddress(recipient) &&
    amount.trim() !== "" &&
    Number(amount) > 0 &&
    !isLoading;

  const handleMint = async () => {
    setError(null);
    setResult(null);
    try {
      await ensureAuthenticated();
      setIsLoading(true);
      const res = await backendFetch<MintResult>("/token-lab/mint", {
        method: "POST",
        body: JSON.stringify({ tokenAddress, to: recipient, amount }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Coins className="h-4 w-4 text-brand-green" />
          Mint Tokens
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Calls <code className="font-mono">mint(to, amount)</code> on a test
          ERC-20 via the backend signer wallet.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <FieldRow label="Token Address *">
          <Input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x… (test ERC-20 contract)"
            className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        <FieldRow label="Recipient Address *">
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x… (mint to this address)"
            className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        <FieldRow label="Amount *" hint="(human-readable, e.g. 1000 for 1000 USDC)">
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Submitting transaction…
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        {result && (
          <SuccessBanner
            message={[
              "Minted successfully!",
              result.txHash && `Tx: ${result.txHash.slice(0, 10)}…${result.txHash.slice(-8)}`,
              result.minted && `Amount confirmed: ${result.minted}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        )}

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
            onClick={handleMint}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Mint"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── APY / yield section ─────────────────────────────────────────────────────

type ApyIntervalUnit = "seconds" | "minutes" | "hours";

interface AddYieldResult {
  txHash: string;
  addedAmount: string;
}

interface ApyScheduleResult {
  txHash: string;
  firstIssueAt: string;
  yieldPerCall: string;
}

function ApyCard() {
  const defaultMorphoVault = getVaultMorphoVaultAddress() ?? "";

  // shared
  const [morphoVault, setMorphoVault] = useState(defaultMorphoVault);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // one-shot add yield
  const [addAmount, setAddAmount] = useState("");
  const [addResult, setAddResult] = useState<AddYieldResult | null>(null);

  // schedule
  const [apyBps, setApyBps] = useState("500"); // 500 bps = 5 %
  const [intervalValue, setIntervalValue] = useState("60");
  const [intervalUnit, setIntervalUnit] = useState<ApyIntervalUnit>("seconds");
  // simulated year: how many real-world seconds = "1 year" for APY math
  // 604800 = 1 week → 52× time compression; 31536000 = real year
  const [simYearDays, setSimYearDays] = useState("7");
  const [scheduleResult, setScheduleResult] = useState<ApyScheduleResult | null>(null);
  const [cancelResult, setCancelResult] = useState<{ cancelled: boolean } | null>(null);

  const { ensureAuthenticated } = useBackendAuth();

  const intervalSeconds = (() => {
    const v = Number(intervalValue);
    if (!Number.isFinite(v) || v <= 0) return 0;
    const multipliers: Record<ApyIntervalUnit, number> = {
      seconds: 1,
      minutes: 60,
      hours: 3600,
    };
    return v * multipliers[intervalUnit];
  })();

  const apyPercent =
    Number(apyBps) > 0 ? (Number(apyBps) / 100).toFixed(2) : "—";

  const canAddYield =
    isAddress(morphoVault) &&
    Number(addAmount) > 0 &&
    !isLoading;

  const canSchedule =
    isAddress(morphoVault) &&
    Number(apyBps) > 0 &&
    intervalSeconds >= 5 &&
    Number(simYearDays) >= 1 &&
    !isLoading;

  const simulatedYearSeconds = Math.round(Number(simYearDays) * 86400);
  // compression ratio for display: e.g. 7 days → "52×"
  const compressionLabel = (() => {
    if (!simulatedYearSeconds) return "";
    const ratio = 31_536_000 / simulatedYearSeconds;
    return ratio >= 2 ? `${Math.round(ratio)}× compression` : "real-time";
  })();

  const handleAddYield = async () => {
    setError(null);
    setAddResult(null);
    setScheduleResult(null);
    try {
      await ensureAuthenticated();
      setIsLoading(true);
      const res = await backendFetch<AddYieldResult>("/token-lab/add-yield", {
        method: "POST",
        body: JSON.stringify({
          morphoVaultAddress: morphoVault,
          amount: addAmount,
        }),
      });
      setAddResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    setError(null);
    setAddResult(null);
    setScheduleResult(null);
    setCancelResult(null);
    try {
      await ensureAuthenticated();
      setIsLoading(true);
      const res = await backendFetch<ApyScheduleResult>(
        "/token-lab/apy-schedule",
        {
          method: "POST",
          body: JSON.stringify({
            morphoVaultAddress: morphoVault,
            apyBps: Number(apyBps),
            intervalSeconds,
            simulatedYearSeconds,
          }),
        },
      );
      setScheduleResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setScheduleResult(null);
    setCancelResult(null);
    try {
      await ensureAuthenticated();
      setIsLoading(true);
      const res = await backendFetch<{ cancelled: boolean }>(
        `/token-lab/apy-schedule/${morphoVault}`,
        { method: "DELETE" },
      );
      setCancelResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-brand-green" />
          Yield / APY
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Calls <code className="font-mono">addYield(amount)</code> on{" "}
          <code className="font-mono">MockMorphoVault</code> — inflates{" "}
          <code className="font-mono">totalAssets</code> so the share price
          rises. APY schedule computes the per-call amount automatically.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <FieldRow label="MockMorphoVault Address *">
          <Input
            value={morphoVault}
            onChange={(e) => setMorphoVault(e.target.value)}
            placeholder="0x…"
            className="h-8 text-xs font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        {/* ── One-shot ── */}
        <div className="border-t border-border" />
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          One-shot
        </p>

        <FieldRow label="Yield Amount *" hint="(human-readable USDC, e.g. 50)">
          <Input
            type="number"
            min="0"
            step="any"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="50"
            className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
            onClick={handleAddYield}
            disabled={!canAddYield}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Add Yield"
            )}
          </Button>
        </div>

        {addResult && (
          <SuccessBanner
            message={`Added ${addResult.addedAmount} USDC · Tx: ${addResult.txHash.slice(0, 10)}…${addResult.txHash.slice(-8)}`}
          />
        )}

        {/* ── Schedule ── */}
        <div className="border-t border-border" />
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          APY Schedule
        </p>
        <p className="text-xs text-muted-foreground -mt-2">
          Backend reads current{" "}
          <code className="font-mono">totalAssets</code>, computes how much
          USDC to inject per interval to hit the target APY, and calls{" "}
          <code className="font-mono">addYield</code> repeatedly.
        </p>

        <FieldRow label="Target APY (basis points) *" hint={`= ${apyPercent}%`}>
          <Input
            type="number"
            min="0"
            max="100000"
            step="1"
            value={apyBps}
            onChange={(e) => setApyBps(e.target.value)}
            placeholder="500"
            className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </FieldRow>

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Interval">
            <div className="flex gap-1.5">
              <Input
                type="number"
                min="1"
                step="1"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                placeholder="60"
                className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <select
                value={intervalUnit}
                onChange={(e) =>
                  setIntervalUnit(e.target.value as ApyIntervalUnit)
                }
                disabled={isLoading}
                className="h-8 rounded-md border border-border bg-secondary px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-green/50"
              >
                <option value="seconds">sec</option>
                <option value="minutes">min</option>
                <option value="hours">hrs</option>
              </select>
            </div>
          </FieldRow>

          <FieldRow label="Simulated year" hint="(days = 1 'year')">
            <Input
              type="number"
              min="1"
              step="1"
              value={simYearDays}
              onChange={(e) => setSimYearDays(e.target.value)}
              placeholder="7"
              className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </FieldRow>
        </div>

        {intervalSeconds > 0 && simulatedYearSeconds > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-mono">{compressionLabel}</span>
            {" · "}fires every {intervalSeconds}s · runs until stopped
          </p>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Communicating with backend…
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        {scheduleResult && (
          <SuccessBanner
            message={[
              "Schedule running!",
              `~${scheduleResult.yieldPerCall} USDC per call.`,
              `Started at ${scheduleResult.firstIssueAt}.`,
              "Use Stop Schedule to cancel.",
            ].join(" · ")}
          />
        )}

        {cancelResult && (
          cancelResult.cancelled
            ? <SuccessBanner message="Schedule cancelled." />
            : <div className="flex items-start gap-2 rounded-md border border-yellow-900/40 bg-yellow-950/20 px-3 py-2.5 text-xs text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>No active schedule found for this vault.</span>
              </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-red-900/40 text-red-400 hover:bg-red-950/20 hover:text-red-300"
            onClick={handleCancel}
            disabled={!isAddress(morphoVault) || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Stop Schedule"
            )}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSchedule}
            disabled={!canSchedule}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Start APY Schedule"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page root ─────────────────────────────────────────────────────────────

export function TokenLabPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <FlaskConical className="h-5 w-5 text-brand-green" />
            <div>
              <h1 className="text-base font-semibold">Token Lab</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Test-environment token manipulation — minting and APY
                configuration. Not for production use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MintCard />
            <ApyCard />
          </div>
        </div>
      </main>
    </div>
  );
}
