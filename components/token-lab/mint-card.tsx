"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import { getVaultUsdcAddress } from "@/lib/praxis-vaults";
import { Coins, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { ErrorBanner, FieldRow, SuccessBanner } from "./token-lab-shared";

interface MintResult {
  txHash?: string;
  minted?: string;
}

export function MintCard() {
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
