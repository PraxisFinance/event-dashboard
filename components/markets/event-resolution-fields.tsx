"use client";

import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/primitives/label";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import type { EventMetadata, ResolutionType } from "@/lib/types/event-market";

interface Props {
  resolutionType: ResolutionType;
  metadata: EventMetadata;
  onMetadataChange: (patch: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

const cls = {
  field: "flex flex-col gap-1.5",
  label: "text-xs font-medium",
  input: "bg-secondary/50 border-border text-foreground text-xs h-8",
  required: "text-red-400 ml-0.5",
  hint: "text-[10px] text-muted-foreground",
};

export function EventResolutionFields({ resolutionType, metadata, onMetadataChange, disabled }: Props) {
  switch (resolutionType) {
    case "above_below":
      return <AboveBelowFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />;
    case "price_range":
      return <PriceRangeFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />;
    case "hit":
      return <HitFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />;
    default:
      return null;
  }
}

function AboveBelowFields({
  metadata,
  onChange,
  disabled,
}: {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}) {
  const strikes = metadata.strikes ?? [{ targetLabel: "" }, { targetLabel: "" }];

  const updateStrike = (idx: number, value: string) => {
    const next = [...strikes];
    next[idx] = { targetLabel: value };
    onChange({ strikes: next });
  };

  const addStrike = () => {
    onChange({ strikes: [...strikes, { targetLabel: "" }] });
  };

  const removeStrike = (idx: number) => {
    if (strikes.length <= 2) return;
    onChange({ strikes: strikes.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className={cls.label}>
        Strike Targets
        <span className={cls.required}>*</span>
        <span className="text-muted-foreground font-normal ml-1">(minimum 2)</span>
      </Label>
      {strikes.map((strike, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={strike.targetLabel}
            onChange={(e) => updateStrike(idx, e.target.value)}
            disabled={disabled}
            placeholder={`Strike ${idx + 1}, e.g. $90,000`}
            className={cls.input + " flex-1"}
          />
          {strikes.length > 2 && (
            <button
              type="button"
              onClick={() => removeStrike(idx)}
              disabled={disabled}
              className="text-muted-foreground hover:text-red-400 disabled:opacity-50 transition-colors"
              aria-label="Remove strike"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStrike}
        disabled={disabled}
        className="h-7 gap-1 text-xs border-border text-muted-foreground hover:text-foreground w-fit"
      >
        <Plus className="h-3 w-3" />
        Add strike
      </Button>
      {strikes.filter((s) => s.targetLabel.trim()).length < 2 && (
        <p className={cls.hint + " text-amber-500/80"}>At least 2 filled strikes required.</p>
      )}
    </div>
  );
}

function PriceRangeFields({
  metadata,
  onChange,
  disabled,
}: {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className={cls.field}>
        <Label className={cls.label}>
          Lower Bound
          <span className={cls.required}>*</span>
        </Label>
        <Input
          value={metadata.lowerBoundLabel ?? ""}
          onChange={(e) => onChange({ lowerBoundLabel: e.target.value })}
          disabled={disabled}
          placeholder="$92,000"
          className={cls.input}
        />
      </div>
      <div className={cls.field}>
        <Label className={cls.label}>
          Upper Bound
          <span className={cls.required}>*</span>
        </Label>
        <Input
          value={metadata.upperBoundLabel ?? ""}
          onChange={(e) => onChange({ upperBoundLabel: e.target.value })}
          disabled={disabled}
          placeholder="$98,000"
          className={cls.input}
        />
      </div>
    </div>
  );
}

function HitFields({
  metadata,
  onChange,
  disabled,
}: {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cls.field}>
      <Label className={cls.label}>
        Target Price
        <span className={cls.required}>*</span>
      </Label>
      <Input
        value={metadata.targetPriceLabel ?? ""}
        onChange={(e) => onChange({ targetPriceLabel: e.target.value })}
        disabled={disabled}
        placeholder="$25.00"
        className={cls.input}
      />
    </div>
  );
}
