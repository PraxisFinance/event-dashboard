"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Button } from "@/components/ui/primitives/button";
import { trpc } from "@/lib/trpc/react";
import type { PredictionEvent } from "@/lib/mock-data";
import {
  CATEGORIES,
  FIXED_RESOLUTION,
  RESOLUTION_TYPES,
  isMetadataComplete,
  type Category,
  type EventMetadata,
  type ResolutionType,
} from "@/lib/types/event-market";
import { EventBaseFields } from "./event-base-fields";
import { EventCategoryFields } from "./category-fields";
import { EventResolutionFields } from "./event-resolution-fields";

interface EditEventMetadataDialogProps {
  event: PredictionEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditEventMetadataDialog({
  event,
  open,
  onOpenChange,
  onSaved,
}: EditEventMetadataDialogProps) {
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editResolutionType, setEditResolutionType] = useState<ResolutionType | null>(null);
  const [editSideALabel, setEditSideALabel] = useState("");
  const [editSideBLabel, setEditSideBLabel] = useState("");
  const [editMetadata, setEditMetadata] = useState<EventMetadata>({});
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const utils = trpc.useUtils();

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      void utils.events.byId.invalidate({ id: event?.id });
      void utils.events.list.invalidate();
      onSaved?.();
    },
    onError: (err) => {
      setError(err.message ?? "Failed to save.");
    },
  });

  useEffect(() => {
    if (!open || !event) return;

    const cat = CATEGORIES.includes(event.category as Category)
      ? (event.category as Category)
      : null;
    const rt = RESOLUTION_TYPES.includes(event.resolutionType as ResolutionType)
      ? (event.resolutionType as ResolutionType)
      : cat
        ? (FIXED_RESOLUTION[cat] ?? null)
        : null;

    setEditCategory(cat);
    setEditResolutionType(rt);
    setEditSideALabel(event.sideALabel ?? "");
    setEditSideBLabel(event.sideBLabel ?? "");
    setEditMetadata((event.metadata as EventMetadata) ?? {});
    setError(null);
    setIsSuccess(false);
  }, [open, event]);

  const patchMetadata = useCallback((patch: Partial<EventMetadata>) => {
    setEditMetadata((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = () => {
    if (!event) return;
    setError(null);

    if (!editCategory) {
      setError("Category is required.");
      return;
    }
    if (!editResolutionType) {
      setError("Resolution type is required.");
      return;
    }
    if (!editSideALabel.trim() || !editSideBLabel.trim()) {
      setError("Side A and Side B labels are required.");
      return;
    }

    updateMutation.mutate({
      id: event.id,
      category: editCategory,
      resolutionType: editResolutionType,
      sideALabel: editSideALabel.trim(),
      sideBLabel: editSideBLabel.trim(),
      metadata: editMetadata as Record<string, unknown>,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setError(null);
      setIsSuccess(false);
    }, 300);
  };

  if (!event) return null;

  const metadataReady = isMetadataComplete(
    editCategory,
    editResolutionType,
    editSideALabel,
    editSideBLabel,
    editMetadata,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Metadata Saved</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-brand-green" />
              <p className="text-lg font-semibold text-foreground">Event metadata updated</p>
              <p className="text-sm text-muted-foreground">
                Category, resolution type, and side labels have been saved.
              </p>
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
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit Event Metadata
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure typed market fields. These are saved to the database immediately — no
                on-chain action required.
              </p>

              <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base Fields
                </p>
                <EventBaseFields
                  category={editCategory}
                  resolutionType={editResolutionType}
                  sideALabel={editSideALabel}
                  sideBLabel={editSideBLabel}
                  onCategoryChange={setEditCategory}
                  onResolutionTypeChange={setEditResolutionType}
                  onSideALabelChange={setEditSideALabel}
                  onSideBLabelChange={setEditSideBLabel}
                  disabled={updateMutation.isPending}
                />
              </div>

              {editCategory && (
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {editCategory.charAt(0).toUpperCase() + editCategory.slice(1)} Details
                  </p>
                  <EventCategoryFields
                    category={editCategory}
                    metadata={editMetadata}
                    onMetadataChange={patchMetadata}
                    disabled={updateMutation.isPending}
                  />
                </div>
              )}

              {editResolutionType &&
                !["up_down", "winner", "yes_no"].includes(editResolutionType) && (
                  <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Resolution Details
                    </p>
                    <EventResolutionFields
                      resolutionType={editResolutionType}
                      metadata={editMetadata}
                      onMetadataChange={patchMetadata}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                )}

              {error && (
                <p className="text-xs text-red-400 rounded border border-red-900/40 bg-red-950/30 px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={updateMutation.isPending}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || !metadataReady}
                className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save Metadata
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
