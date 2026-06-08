"use client";

import { useEffect, useState } from "react";
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
  arrayToInput,
  inputToArray,
  MarketMetadataFields,
} from "@/components/markets/market-metadata-fields";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import type { EnrichedSourceMarket } from "@/types/source-market";
import type { VaultState } from "@/lib/envio";
import { useVaultStore } from "@/lib/stores/vault-store";
import { BellRing, Loader2 } from "lucide-react";

interface SubscribeDialogProps {
  market: EnrichedSourceMarket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribed?: () => void;
}

export function SubscribeDialog({
  market,
  open,
  onOpenChange,
  onSubscribed,
}: SubscribeDialogProps) {
  const selectedVault = useVaultStore((s) => s.selectedVault);
  const [vault, setVault] = useState("");
  const [cpfAddress, setCpfAddress] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [resolutionTypeTuple, setResolutionTypeTuple] = useState<string | null>(
    null,
  );
  const [marketType, setMarketType] = useState("");

  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [vaultsList, setVaultsList] = useState<VaultState[]>([]);
  useEffect(() => {
    backendFetch<VaultState[]>('/vaults').then(setVaultsList).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open || !market) return;
    const matchedVault = selectedVault?.id
      ? vaultsList?.find(
          (v) => v.id.toLowerCase() === selectedVault.id.toLowerCase(),
        )
      : undefined;
    setVault(selectedVault?.id ?? "");
    setCpfAddress(matchedVault?.cpfPool?.id ?? "");
    setCategories(arrayToInput(market.categories));
    setTags(arrayToInput(market.tags));
    setResolutionTypeTuple(null);
    setMarketType(market.marketType ?? "");
  }, [open, market, selectedVault?.id, vaultsList]);

  const stableSlug = market?.stableSlug;
  const canSubscribe = Boolean(stableSlug && cpfAddress.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market || !stableSlug) return;

    try {
      await ensureAuthenticated();
      setIsSaving(true);
      setError(null);
      await backendFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          stableSlug,
          title: market.title,
          vault: vault.trim() || null,
          cpfAddress: cpfAddress.trim(),
          categories: inputToArray(categories),
          tags: inputToArray(tags),
          resolutionTypeTuple: resolutionTypeTuple?.trim() || null,
          marketType: marketType.trim() || null,
        }),
      });
      void utils.source.list.invalidate();
      void utils.source.search.invalidate();
      void utils.subscriptions.list.invalidate();
      onSubscribed?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subscription");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4" />
            Subscribe to market
          </DialogTitle>
        </DialogHeader>

        {market && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <p className="text-sm font-medium leading-snug">{market.title}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stable slug</Label>
              {stableSlug ? (
                <p className="text-sm font-mono text-foreground">{stableSlug}</p>
              ) : (
                <p className="text-sm text-amber-500">
                  This market has no stableSlug — subscription is not available.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              When a new Source market appears with this stable slug, an event
              will be deployed automatically using the configured CPF pool factory.
            </p>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sub-vault" className="text-xs">
                Vault address
              </Label>
              <Input
                id="sub-vault"
                value={vault}
                onChange={(e) => setVault(e.target.value)}
                placeholder="0x…"
                className="h-8 text-xs bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-cpf" className="text-xs">
                CPF pool factory address
              </Label>
              <Input
                id="sub-cpf"
                value={cpfAddress}
                onChange={(e) => setCpfAddress(e.target.value)}
                placeholder="0x…"
                required
                className="h-8 text-xs bg-secondary border-border"
              />
              <p className="text-[11px] text-muted-foreground">
                Required for auto-deploy. This is the CPF/pool factory used by
                `createPool`.
              </p>
            </div>

            <MarketMetadataFields
              idPrefix="sub"
              categories={categories}
              tags={tags}
              marketType={marketType}
              resolutionTypeTuple={resolutionTypeTuple}
              onCategoriesChange={setCategories}
              onTagsChange={setTags}
              onMarketTypeChange={setMarketType}
              onResolutionTypeTupleChange={setResolutionTypeTuple}
              inputClassName="h-8 text-xs bg-secondary border-border"
              fieldClassName="space-y-1.5"
              labelClassName="text-xs"
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
                disabled={!canSubscribe || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving…
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
