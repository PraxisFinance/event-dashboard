"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import {
  DEFAULT_INITIAL_LIQUIDITY_USDC,
  getDefaultCtfContractAddress,
  praxisChain,
} from "@/lib/praxis-pool";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Textarea } from "@/components/ui/primitives/textarea";
import {
  arrayToInput,
  inputToArray,
  MarketMetadataFields,
} from "@/components/markets/market-metadata-fields";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import { useVaultStore } from "@/lib/stores/vault-store";
import type { VaultState } from "@/lib/envio";
import type { Address } from "viem";

export interface CreateMarketEvent {
  id: string;
  title: string;
  description?: string | null;
  /** Unix timestamp in seconds (from Source `expirationTimestamp`, normalised). */
  expirationTimestamp?: number | null;
  source: string;
  conditionId?: string | null;
  categories?: string[];
  tags?: string[];
  marketType?: string | null;
  slug?: string | null;
  vault?: string | null;
  /** Remote logo URL from the Source market (`logo` field). */
  logo?: string | null;
}

interface CreateMarketDialogProps {
  event: CreateMarketEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromoted?: (id: string) => void;
}

/** Normalise Source expirationTimestamp (may be ms or s) → unix seconds */
function normaliseTs(ts: number | null | undefined): number | null {
  if (!ts) return null;
  return ts > 1e10 ? Math.floor(ts / 1000) : ts;
}

/** Format a Date to `YYYY-MM-DDTHH:mm` (local time) for datetime-local inputs. */
function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Default votingDeadline = expiration - (expiration - now) * 0.1 */
function defaultVotingDeadline(expirationTs: number): string {
  const nowTs = Math.floor(Date.now() / 1000);
  const deadlineTs = Math.round(expirationTs - (expirationTs - nowTs) * 0.1);
  return toDatetimeLocal(new Date(deadlineTs * 1000));
}

export function CreateMarketDialog({
  event,
  open,
  onOpenChange,
  onPromoted,
}: CreateMarketDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [initialLiquidityInput, setInitialLiquidityInput] = useState(
    String(DEFAULT_INITIAL_LIQUIDITY_USDC),
  );

  // Editable fields — initialised from event on open
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategories, setEditCategories] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editExpirationInput, setEditExpirationInput] = useState("");
  const [editMarketType, setEditMarketType] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [votingDeadlineInput, setVotingDeadlineInput] = useState("");
  const [resolutionTypeTuple, setResolutionTypeTuple] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open || !event) return;
    setEditTitle(event.title);
    setEditDescription(event.description ?? "");
    setEditCategories(arrayToInput(event.categories));
    setEditTags(arrayToInput(event.tags));
    setEditMarketType(event.marketType ?? "");
    setEditSlug(event.slug ?? "");

    const expTs = normaliseTs(event.expirationTimestamp);
    if (expTs) {
      setEditExpirationInput(toDatetimeLocal(new Date(expTs * 1000)));
      setVotingDeadlineInput(defaultVotingDeadline(expTs));
    } else {
      setEditExpirationInput("");
      setVotingDeadlineInput("");
    }
  }, [open, event]);

  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [vaultsList, setVaultsList] = useState<VaultState[]>([]);
  useEffect(() => {
    backendFetch<VaultState[]>('/vaults').then(setVaultsList).catch(() => {});
  }, []);
  const selectedVault = useVaultStore((s) => s.selectedVault);
  const vaultAddress = selectedVault?.id?.trim() ?? "";

  const [isLoading, setIsLoading] = useState(false);

  /** Resolved expiration ts from the edited datetime-local input */
  const editedExpirationTs = editExpirationInput
    ? Math.floor(new Date(editExpirationInput).getTime() / 1000)
    : null;

  const conditionId = event?.conditionId?.trim() ?? null;

  const {
    matchedVault,
    poolFactory,
    poolTokenAddress,
    ytAddress,
    vaultContractAddress,
    poolTokenBlockers,
  } = useMemo(() => {
    const trimmedVaultId = vaultAddress;
    const matched =
      trimmedVaultId && vaultsList?.length
        ? vaultsList.find(
            (v) => v.id.toLowerCase() === trimmedVaultId.toLowerCase(),
          )
        : undefined;

    let factory: Address | undefined;
    let token: Address | undefined;
    let ytAddr: Address | undefined;
    let vaultAddr: Address | undefined;

    if (trimmedVaultId) {
      const cp = matched?.cpfPool;
      const rawFactory = cp?.id?.trim();
      if (rawFactory && isAddress(rawFactory))
        factory = rawFactory as Address;
      token = getDefaultCtfContractAddress();

      if (matched) {
        if (isAddress(matched.yt)) ytAddr = matched.yt as Address;
        if (isAddress(matched.id)) vaultAddr = matched.id as Address;
      }
    }

    const vaultNotInList = Boolean(trimmedVaultId && vaultsList && !matched);
    const vaultNeedsIndexerCpfPool = Boolean(
      trimmedVaultId && matched && (!factory || !token || !ytAddr),
    );

    return {
      matchedVault: matched,
      poolFactory: factory,
      poolTokenAddress: token,
      ytAddress: ytAddr,
      vaultContractAddress: vaultAddr,
      poolTokenBlockers: {
        vaultNotInList,
        vaultNeedsIndexerCpfPool,
      },
    };
  }, [vaultAddress, vaultsList]);

  const poolTokenConfigured =
    Boolean(poolTokenAddress) && !poolTokenBlockers.vaultNotInList;
  const hasConditionId = Boolean(conditionId);
  const hasExpiration = Boolean(
    editedExpirationTs && !Number.isNaN(editedExpirationTs),
  );

  const canSubmitOnChain = Boolean(
    poolFactory &&
    poolTokenConfigured &&
    !poolTokenBlockers.vaultNeedsIndexerCpfPool &&
    ytAddress &&
    vaultContractAddress &&
    hasConditionId &&
    hasExpiration,
  );

  const handleCreate = async () => {
    if (!event) return;
    setError(null);

    try {
      if (!poolFactory) {
        if (vaultAddress) {
          if (!matchedVault)
            throw new Error(
              "Unknown vault: it is not in the indexer list. Select an indexed vault on the Vaults page.",
            );
          throw new Error(
            "This vault has no indexer CPF match (need CPFDeploymentInfo where stakingToken is the vault YT), or the CPF address is invalid. Refresh after Envio sync.",
          );
        }
        throw new Error(
          "Missing pool factory. Set NEXT_PUBLIC_PRAXIS_POOL_FACTORY_ADDRESS or select an active vault on the Vaults page (indexed with CPFDeploymentInfo for that vault's YT).",
        );
      }
      if (!conditionId)
        throw new Error(
          "Missing conditionId. It must come from the Source market.",
        );
      if (!editedExpirationTs || Number.isNaN(editedExpirationTs))
        throw new Error("Set a valid expiration date before deploying.");
      if (!votingDeadlineInput) throw new Error("Voting deadline is required.");
      if (!vaultContractAddress)
        throw new Error("No vault contract address available. Select an indexed vault.");

      const votingDeadlineTs = Math.floor(
        new Date(votingDeadlineInput).getTime() / 1000,
      );
      if (Number.isNaN(votingDeadlineTs)) throw new Error("Invalid voting deadline.");
      if (votingDeadlineTs > editedExpirationTs)
        throw new Error("Voting deadline must be on or before the expiration.");

      const parsedLiquidity = parseInt(initialLiquidityInput, 10);
      if (!parsedLiquidity || Number.isNaN(parsedLiquidity) || parsedLiquidity <= 0)
        throw new Error("Initial liquidity must be a positive number.");

      await ensureAuthenticated();
      setIsLoading(true);

      const result = await backendFetch<{ contractTxHash: string; contractEventId: string }>(
        '/api/events/deploy-market',
        {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            eventSource: event.source as "praxis" | "source",
            sourceId: event.source === "source" ? event.id : null,
            conditionId,
            logo: event.logo ?? null,
            vaultAddress: vaultContractAddress,
            poolFactoryAddress: poolFactory,
            expirationTs: editedExpirationTs,
            votingDeadlineTs,
            initialLiquidityUsdc: parsedLiquidity,
            title: editTitle,
            description: editDescription || null,
            categories: inputToArray(editCategories),
            tags: inputToArray(editTags),
            marketType: editMarketType || null,
            slug: editSlug || null,
            resolutionTypeTuple: resolutionTypeTuple ?? null,
            cpfAddress: poolFactory,
            vault: vaultAddress || null,
          }),
        },
      );

      setTxHash(result.contractTxHash as `0x${string}`);
      setIsSuccess(true);
      void utils.events.list.invalidate();
      onPromoted?.(event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setError(null);
      setTxHash(undefined);
      setIsSuccess(false);
      setVotingDeadlineInput("");
      setResolutionTypeTuple(null);
    }, 300);
  };

  if (!event) return null;

  const truncatedTx = txHash
    ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Market Created
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-brand-green" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Market Created Successfully
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your prediction market has been deployed to the Praxis smart
                  contract on {praxisChain.name}.
                </p>
              </div>
              {txHash && (
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-xs text-muted-foreground">
                    Transaction Hash
                  </p>
                  <a
                    href={`${praxisChain.blockExplorers.default.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-brand-blue underline underline-offset-2 hover:text-brand-blue/80"
                  >
                    {truncatedTx}
                  </a>
                  <a
                    href={`${praxisChain.blockExplorers.default.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on {praxisChain.blockExplorers.default.name}
                  </a>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button className="w-full" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Create Market on Praxis
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-2">
              {/* Source badge + read-only IDs */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-brand-blue/15 text-brand-blue border-brand-blue/30 text-xs">
                  {event.source === "source" ? "Source" : "Praxis"}
                </Badge>
                {conditionId && (
                  <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border truncate max-w-[200px]">
                    {conditionId}
                  </span>
                )}
              </div>

              {/* ── Editable fields ── */}
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Market Parameters
                </p>

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-title" className="text-xs font-medium">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isLoading}
                    className="bg-secondary/50 border-border text-foreground text-xs h-8"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-desc" className="text-xs font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="bg-secondary/50 border-border text-foreground text-xs resize-none"
                  />
                </div>

                {/* Expiration */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="edit-expiration"
                    className="text-xs font-medium"
                  >
                    Expiration Date
                  </Label>
                  <Input
                    id="edit-expiration"
                    type="datetime-local"
                    value={editExpirationInput}
                    min={toDatetimeLocal(new Date())}
                    onChange={(e) => {
                      setEditExpirationInput(e.target.value);
                      const ts = Math.floor(
                        new Date(e.target.value).getTime() / 1000,
                      );
                      if (!Number.isNaN(ts)) {
                        setVotingDeadlineInput(defaultVotingDeadline(ts));
                      }
                    }}
                    disabled={isLoading}
                    className="bg-secondary/50 border-border text-foreground text-xs h-8"
                  />
                </div>

                {/* Voting deadline */}
                {hasExpiration && (
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="voting-deadline"
                      className="text-xs font-medium"
                    >
                      Voting Deadline
                    </Label>
                    <Input
                      id="voting-deadline"
                      type="datetime-local"
                      value={votingDeadlineInput}
                      max={editExpirationInput || undefined}
                      min={toDatetimeLocal(new Date())}
                      onChange={(e) => setVotingDeadlineInput(e.target.value)}
                      disabled={isLoading}
                      className="bg-secondary/50 border-border text-foreground text-xs h-8"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be on or before expiration. Defaults to 10% before
                      expiry.
                    </p>
                  </div>
                )}

                <MarketMetadataFields
                  idPrefix="edit"
                  categories={editCategories}
                  tags={editTags}
                  marketType={editMarketType}
                  resolutionTypeTuple={resolutionTypeTuple}
                  onCategoriesChange={setEditCategories}
                  onTagsChange={setEditTags}
                  onMarketTypeChange={setEditMarketType}
                  onResolutionTypeTupleChange={setResolutionTypeTuple}
                  disabled={isLoading}
                />

                {/* Slug */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-slug" className="text-xs font-medium">
                    Slug
                  </Label>
                  <Input
                    id="edit-slug"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. will-btc-hit-100k"
                    className="bg-secondary/50 border-border text-foreground text-xs h-8"
                  />
                </div>

                {/* Initial liquidity */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="initial-liquidity"
                    className="text-xs font-medium"
                  >
                    Initial Liquidity (USDC per side)
                  </Label>
                  <Input
                    id="initial-liquidity"
                    type="number"
                    min="1"
                    step="1"
                    value={initialLiquidityInput}
                    onChange={(e) => setInitialLiquidityInput(e.target.value)}
                    disabled={isLoading}
                    className="bg-secondary/50 border-border text-foreground text-xs h-8"
                  />
                  <p className="text-xs text-muted-foreground">
                    Seeds the YES and NO reserves equally. Backend wallet pulls
                    2× this amount from its balance.
                  </p>
                </div>

                {/* Vault (from global Vaults selection) */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Active vault</Label>
                  <div
                    className="flex min-h-8 w-full items-center rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-foreground"
                    aria-live="polite"
                  >
                    {vaultAddress ? (
                      <span className="font-mono break-all">
                        {vaultAddress}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        None selected — choose a vault on the Vaults page.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex gap-2.5 rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transactions are signed by the backend deployer wallet. No
                  wallet popup required. This will run 6 sequential
                  transactions and may take ~30s.
                </p>
              </div>

              {!canSubmitOnChain && (
                <div className="flex gap-2.5 rounded-lg border border-border bg-secondary/40 p-3">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                    {(!poolFactory || !poolTokenConfigured) && (
                      <p>
                        With an active vault (Vaults page), the pool factory
                        comes from Envio{" "}
                        <span className="font-mono text-foreground">
                          CPFDeploymentInfo.id
                        </span>{" "}
                        (matched by{" "}
                        <span className="font-mono text-foreground">
                          stakingToken
                        </span>{" "}
                        = vault YT). The CTF contract uses{" "}
                        <span className="font-mono text-foreground">
                          NEXT_PUBLIC_CTF_CONTRACT_ADDRESS
                        </span>
                        . With no active vault, set{" "}
                        <span className="font-mono text-foreground">
                          NEXT_PUBLIC_PRAXIS_POOL_FACTORY_ADDRESS
                        </span>{" "}
                        and{" "}
                        <span className="font-mono text-foreground">
                          NEXT_PUBLIC_CTF_CONTRACT_ADDRESS
                        </span>{" "}
                        in{" "}
                        <span className="font-mono text-foreground">
                          .env.local
                        </span>
                        . Restart{" "}
                        <span className="font-mono text-foreground">
                          pnpm dev
                        </span>{" "}
                        after editing env.
                      </p>
                    )}
                    <p className="text-foreground font-medium">Still needed:</p>
                    <ul className="list-disc pl-4 space-y-1 marker:text-muted-foreground">
                      {!poolFactory && (
                        <li>
                          {vaultAddress ? (
                            <>
                              <span className="font-mono text-foreground">
                                CPFDeploymentInfo
                              </span>{" "}
                              for this vault (
                              <span className="font-mono text-foreground">
                                stakingToken
                              </span>{" "}
                              = YT), from Envio
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
                          Active vault address must match an indexed vault (pick
                          one on the Vaults page).
                        </li>
                      )}
                      {poolTokenBlockers.vaultNeedsIndexerCpfPool && (
                        <li>
                          Active vault needs a matching{" "}
                          <span className="font-mono text-foreground">
                            CPFDeploymentInfo
                          </span>{" "}
                          and valid{" "}
                          <span className="font-mono text-foreground">
                            NEXT_PUBLIC_CTF_CONTRACT_ADDRESS
                          </span>
                          .
                        </li>
                      )}
                      {!vaultAddress && !poolTokenAddress && (
                        <li>
                          Set{" "}
                          <span className="font-mono text-foreground">
                            NEXT_PUBLIC_CTF_CONTRACT_ADDRESS
                          </span>{" "}
                          (and select a vault with Envio{" "}
                          <span className="font-mono text-foreground">
                            CPFDeploymentInfo
                          </span>{" "}
                          for the factory).
                        </li>
                      )}
                      {!hasConditionId && (
                        <li>
                          Source{" "}
                          <span className="font-mono text-foreground">
                            conditionId
                          </span>{" "}
                          on this event
                        </li>
                      )}
                      {!hasExpiration && (
                        <li>
                          <span className="font-mono text-foreground">
                            expirationTimestamp
                          </span>{" "}
                          — set above
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 rounded border border-red-900/40 bg-red-950/30 px-3 py-2">
                  {error}
                </p>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deploying on-chain via backend wallet — 6 transactions,
                  please wait (~30s)…
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isLoading || !canSubmitOnChain}
                className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Create Market
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
