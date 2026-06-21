"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Link2, Loader2 } from "lucide-react";
import type { PriceOracleMetadata, SourceSubMarket } from "@/types/source-market";
import type { Category, EventMetadata, ResolutionType } from "@/lib/types/event-market";
import { EventBaseFields } from "./event-base-fields";
import { EventCategoryFields } from "./category-fields";
import { EventResolutionFields } from "./event-resolution-fields";
import { MarketSuccessView } from "./market-success-view";
import { MarketDeployBlocker } from "./market-deploy-blocker";
import { useCreateMarketForm, toDatetimeLocal, defaultVotingDeadline } from "./use-create-market-form";

export interface CreateMarketEvent {
  id: string;
  title: string;
  description?: string | null;
  expirationTimestamp?: number | null;
  source: string;
  conditionId?: string | null;
  categories?: string[];
  tags?: string[];
  marketType?: string | null;
  slug?: string | null;
  vault?: string | null;
  logo?: string | null;
  category?: string | null;
  resolutionType?: string | null;
  sideALabel?: string | null;
  sideBLabel?: string | null;
  metadata?: EventMetadata | null;
  logoPath?: string | null;
  markets?: SourceSubMarket[];
  sourceMetadata?: Record<string, unknown>;
  priceOracleMetadata?: PriceOracleMetadata;
  expirationDate?: string;
}

interface CreateMarketDialogProps {
  event: CreateMarketEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromoted?: (id: string) => void;
}

export function CreateMarketDialog({
  event,
  open,
  onOpenChange,
  onPromoted,
}: CreateMarketDialogProps) {
  const form = useCreateMarketForm(event, open, onOpenChange, onPromoted);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={form.handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[90vh] overflow-y-auto">
        {form.isSuccess ? (
          <MarketSuccessView txHash={form.txHash} onClose={form.handleClose} />
        ) : (
          <MarketFormView form={form} event={event} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MarketFormView({
  form,
  event,
}: {
  form: ReturnType<typeof useCreateMarketForm>;
  event: CreateMarketEvent;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-foreground">Create Market on Praxis</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5 py-2">
        <SourceIdRow source={event.source} conditionId={form.conditionId} />
        <MarketParametersSection form={form} />
        <MarketTypeSection form={form} />
        <InfoBanner />

        {!form.canSubmitOnChain && (
          <MarketDeployBlocker
            poolFactory={form.poolFactory}
            poolTokenAddress={form.poolTokenAddress}
            poolTokenConfigured={form.poolTokenConfigured}
            poolTokenBlockers={form.poolTokenBlockers}
            vaultAddress={form.vaultAddress}
            hasConditionId={form.hasConditionId}
            hasExpiration={form.hasExpiration}
            metadataReady={form.metadataReady}
          />
        )}

        {form.error && (
          <p className="text-xs text-red-400 rounded border border-red-900/40 bg-red-950/30 px-3 py-2">
            {form.error}
          </p>
        )}

        {form.isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Deploying on-chain via backend wallet — 6 transactions, please wait (~30s)…
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          onClick={form.handleClose}
          disabled={form.isLoading}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={form.handleCreate}
          disabled={form.isLoading || !form.canSubmitOnChain}
          className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
        >
          {form.isLoading ? (
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
  );
}

function SourceIdRow({ source, conditionId }: { source: string; conditionId: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="bg-brand-blue/15 text-brand-blue border-brand-blue/30 text-xs">
        {source === "source" ? "Source" : "Praxis"}
      </Badge>
      {conditionId && (
        <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border truncate max-w-[200px]">
          {conditionId}
        </span>
      )}
    </div>
  );
}

function MarketParametersSection({ form }: { form: ReturnType<typeof useCreateMarketForm> }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Market Parameters
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title" className="text-xs font-medium">Title</Label>
        <Input
          id="edit-title"
          value={form.editTitle}
          onChange={(e) => form.setEditTitle(e.target.value)}
          disabled={form.isLoading}
          className="bg-secondary/50 border-border text-foreground text-xs h-8"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-desc" className="text-xs font-medium">Description</Label>
        <Textarea
          id="edit-desc"
          value={form.editDescription}
          onChange={(e) => form.setEditDescription(e.target.value)}
          disabled={form.isLoading}
          rows={3}
          className="bg-secondary/50 border-border text-foreground text-xs resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-expiration" className="text-xs font-medium">Expiration Date</Label>
        <Input
          id="edit-expiration"
          type="datetime-local"
          value={form.editExpirationInput}
          min={toDatetimeLocal(new Date())}
          onChange={(e) => {
            form.setEditExpirationInput(e.target.value);
            const ts = Math.floor(new Date(e.target.value).getTime() / 1000);
            if (!Number.isNaN(ts)) form.setVotingDeadlineInput(defaultVotingDeadline(ts));
          }}
          disabled={form.isLoading}
          className="bg-secondary/50 border-border text-foreground text-xs h-8"
        />
      </div>

      {form.hasExpiration && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="voting-deadline" className="text-xs font-medium">Voting Deadline</Label>
          <Input
            id="voting-deadline"
            type="datetime-local"
            value={form.votingDeadlineInput}
            max={form.editExpirationInput || undefined}
            min={toDatetimeLocal(new Date())}
            onChange={(e) => form.setVotingDeadlineInput(e.target.value)}
            disabled={form.isLoading}
            className="bg-secondary/50 border-border text-foreground text-xs h-8"
          />
          <p className="text-xs text-muted-foreground">
            Must be on or before expiration. Defaults to 10% before expiry.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-slug" className="text-xs font-medium">Slug</Label>
        <Input
          id="edit-slug"
          value={form.editSlug}
          onChange={(e) => form.setEditSlug(e.target.value)}
          disabled={form.isLoading}
          placeholder="e.g. will-btc-hit-100k"
          className="bg-secondary/50 border-border text-foreground text-xs h-8"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="initial-liquidity" className="text-xs font-medium">
          Initial Liquidity (USDC per side)
        </Label>
        <Input
          id="initial-liquidity"
          type="number"
          min="1"
          step="1"
          value={form.initialLiquidityInput}
          onChange={(e) => form.setInitialLiquidityInput(e.target.value)}
          disabled={form.isLoading}
          className="bg-secondary/50 border-border text-foreground text-xs h-8"
        />
        <p className="text-xs text-muted-foreground">
          Seeds the YES and NO reserves equally. Backend wallet pulls 2× this amount from its
          balance.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Active vault</Label>
        <div
          className="flex min-h-8 w-full items-center rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-foreground"
          aria-live="polite"
        >
          {form.vaultAddress ? (
            <span className="font-mono break-all">{form.vaultAddress}</span>
          ) : (
            <span className="text-muted-foreground">
              None selected — choose a vault on the Vaults page.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketTypeSection({ form }: { form: ReturnType<typeof useCreateMarketForm> }) {
  return (
    <>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Market Type & Resolution
          <span className="text-red-400 ml-1">*</span>
        </p>
        <EventBaseFields
          category={form.editCategory}
          resolutionType={form.editResolutionType}
          sideALabel={form.editSideALabel}
          sideBLabel={form.editSideBLabel}
          onCategoryChange={(v: Category | null) => form.setEditCategory(v)}
          onResolutionTypeChange={(v: ResolutionType | null) => form.setEditResolutionType(v)}
          onSideALabelChange={form.setEditSideALabel}
          onSideBLabelChange={form.setEditSideBLabel}
          disabled={form.isLoading}
        />
      </div>

      {form.editCategory && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {form.editCategory.charAt(0).toUpperCase() + form.editCategory.slice(1)} Details
            <span className="text-red-400 ml-1">*</span>
          </p>
          <EventCategoryFields
            category={form.editCategory}
            metadata={form.editMetadata}
            onMetadataChange={form.patchMetadata}
            disabled={form.isLoading}
          />
        </div>
      )}

      {form.editResolutionType &&
        !["up_down", "winner", "yes_no"].includes(form.editResolutionType) && (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Resolution Details
              <span className="text-red-400 ml-1">*</span>
            </p>
            <EventResolutionFields
              resolutionType={form.editResolutionType}
              metadata={form.editMetadata}
              onMetadataChange={form.patchMetadata}
              disabled={form.isLoading}
            />
          </div>
        )}
    </>
  );
}

function InfoBanner() {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Transactions are signed by the backend deployer wallet. No wallet popup required. This will
        run 6 sequential transactions and may take ~30s.
      </p>
    </div>
  );
}
