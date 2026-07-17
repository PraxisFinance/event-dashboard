import { AlertTriangle } from "lucide-react";
import type { Address } from "viem";

interface MarketDeployBlockerProps {
  poolFactory: Address | undefined;
  poolTokenAddress: Address | undefined;
  poolTokenConfigured: boolean;
  poolTokenBlockers: { vaultNotInList: boolean; vaultNeedsIndexerCpfPool: boolean };
  vaultAddress: string;
  hasConditionId: boolean;
  hasExpiration: boolean;
  metadataReady: boolean;
}

export function MarketDeployBlocker({
  poolFactory,
  poolTokenAddress,
  poolTokenConfigured,
  poolTokenBlockers,
  vaultAddress,
  hasConditionId,
  hasExpiration,
  metadataReady,
}: MarketDeployBlockerProps) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border bg-secondary/40 p-3">
      <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
        {(!poolFactory || !poolTokenConfigured) && (
          <p>
            With an active vault (Vaults page), the pool factory comes from Envio{" "}
            <span className="font-mono text-foreground">CPFDeploymentInfo.id</span> (matched by{" "}
            <span className="font-mono text-foreground">stakingToken</span> = vault YT). The CTF
            contract uses <span className="font-mono text-foreground">conditionalTokens</span>.
            With no active vault, set{" "}
            <span className="font-mono text-foreground">
              NEXT_PUBLIC_PRAXIS_POOL_FACTORY_ADDRESS
            </span>{" "}
            and <span className="font-mono text-foreground">conditionalTokens</span> in{" "}
            <span className="font-mono text-foreground">config/contracts.ts</span>. Restart{" "}
            <span className="font-mono text-foreground">pnpm dev</span> after editing env.
          </p>
        )}
        <p className="text-foreground font-medium">Still needed:</p>
        <ul className="list-disc pl-4 space-y-1 marker:text-muted-foreground">
          {!poolFactory && (
            <li>
              {vaultAddress ? (
                <>
                  <span className="font-mono text-foreground">CPFDeploymentInfo</span> for this
                  vault (<span className="font-mono text-foreground">stakingToken</span> = YT),
                  from Envio
                </>
              ) : (
                <span className="font-mono text-foreground">
                  NEXT_PUBLIC_PRAXIS_POOL_FACTORY_ADDRESS
                </span>
              )}
            </li>
          )}
          {poolTokenBlockers.vaultNotInList && (
            <li>
              Active vault address must match an indexed vault (pick one on the Vaults page).
            </li>
          )}
          {poolTokenBlockers.vaultNeedsIndexerCpfPool && (
            <li>
              Active vault needs a matching{" "}
              <span className="font-mono text-foreground">CPFDeploymentInfo</span> and valid{" "}
              <span className="font-mono text-foreground">conditionalTokens</span> (see
              config/contracts.ts).
            </li>
          )}
          {!vaultAddress && !poolTokenAddress && (
            <li>
              Set <span className="font-mono text-foreground">conditionalTokens</span> in
              config/contracts.ts (and select a vault with Envio{" "}
              <span className="font-mono text-foreground">CPFDeploymentInfo</span> for the
              factory).
            </li>
          )}
          {!hasConditionId && (
            <li>
              Source <span className="font-mono text-foreground">conditionId</span> on this event
            </li>
          )}
          {!hasExpiration && (
            <li>
              <span className="font-mono text-foreground">expirationTimestamp</span> — set above
            </li>
          )}
          {!metadataReady && <li>Complete all required market type fields above.</li>}
        </ul>
      </div>
    </div>
  );
}
