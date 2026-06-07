"use client";

import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";

export function arrayToInput(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

export function inputToArray(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const RESOLUTION_TUPLES = [
  { value: "Up/Down", inFavor: "Up", against: "Down" },
  { value: "Above/Below", inFavor: "Above", against: "Below" },
  {
    value: "In Range/Out of Range",
    inFavor: "In Range",
    against: "Out of Range",
  },
  {
    value: "Will Hit/Will Not Hit",
    inFavor: "Will Hit",
    against: "Will Not Hit",
  },
] as const;

interface MarketMetadataFieldsProps {
  idPrefix: string;
  categories: string;
  tags: string;
  marketType: string;
  resolutionTypeTuple: string | null;
  onCategoriesChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onMarketTypeChange: (value: string) => void;
  onResolutionTypeTupleChange: (value: string | null) => void;
  disabled?: boolean;
  inputClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
}

export function MarketMetadataFields({
  idPrefix,
  categories,
  tags,
  marketType,
  resolutionTypeTuple,
  onCategoriesChange,
  onTagsChange,
  onMarketTypeChange,
  onResolutionTypeTupleChange,
  disabled = false,
  inputClassName = "bg-secondary/50 border-border text-foreground text-xs h-8",
  fieldClassName = "flex flex-col gap-1.5",
  labelClassName = "text-xs font-medium",
}: MarketMetadataFieldsProps) {
  return (
    <>
      <div className={fieldClassName}>
        <Label className={labelClassName}>
          Resolution Labels
          <span className="text-muted-foreground font-normal ml-1">
            (In Favor / Against naming)
          </span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {RESOLUTION_TUPLES.map((opt) => {
            const selected = resolutionTypeTuple === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onResolutionTypeTupleChange(selected ? null : opt.value)
                }
                className={[
                  "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selected
                    ? "border-brand-blue bg-brand-blue/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80 hover:bg-secondary/60",
                ].join(" ")}
              >
                <span className="text-[11px] font-semibold leading-none">
                  {opt.inFavor}
                </span>
                <span className="text-[10px] leading-none opacity-70">
                  vs {opt.against}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={fieldClassName}>
        <Label htmlFor={`${idPrefix}-market-type`} className={labelClassName}>
          Market Type
        </Label>
        <Input
          id={`${idPrefix}-market-type`}
          value={marketType}
          onChange={(e) => onMarketTypeChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. binary, scalar"
          className={inputClassName}
        />
      </div>

      <div className={fieldClassName}>
        <Label htmlFor={`${idPrefix}-categories`} className={labelClassName}>
          Categories
          <span className="text-muted-foreground font-normal ml-1">
            (comma-separated)
          </span>
        </Label>
        <Input
          id={`${idPrefix}-categories`}
          value={categories}
          onChange={(e) => onCategoriesChange(e.target.value)}
          disabled={disabled}
          placeholder="Crypto, Finance"
          className={inputClassName}
        />
      </div>

      <div className={fieldClassName}>
        <Label htmlFor={`${idPrefix}-tags`} className={labelClassName}>
          Tags
          <span className="text-muted-foreground font-normal ml-1">
            (comma-separated)
          </span>
        </Label>
        <Input
          id={`${idPrefix}-tags`}
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          disabled={disabled}
          placeholder="bitcoin, prediction"
          className={inputClassName}
        />
      </div>
    </>
  );
}
