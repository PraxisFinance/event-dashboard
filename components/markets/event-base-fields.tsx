"use client";

import { Label } from "@/components/ui/primitives/label";
import { Input } from "@/components/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  CATEGORIES,
  CATEGORY_RESOLUTION_MAP,
  FIXED_RESOLUTION,
  RESOLUTION_TYPE_LABELS,
  type Category,
  type ResolutionType,
} from "@/lib/types/event-market";

const CATEGORY_LABELS: Record<Category, string> = {
  crypto: "Crypto",
  esports: "Esports",
  sport: "Sport",
  politics: "Politics",
  tech: "Tech",
  finance: "Finance",
};

const SIDE_A_PLACEHOLDERS: Record<Category, string> = {
  crypto: "Up",
  esports: "Team A name",
  sport: "Team A name",
  politics: "Yes",
  tech: "Yes",
  finance: "Yes",
};

const SIDE_B_PLACEHOLDERS: Record<Category, string> = {
  crypto: "Down",
  esports: "Team B name",
  sport: "Team B name",
  politics: "No",
  tech: "No",
  finance: "No",
};

interface EventBaseFieldsProps {
  category: Category | null;
  resolutionType: ResolutionType | null;
  sideALabel: string;
  sideBLabel: string;
  onCategoryChange: (v: Category | null) => void;
  onResolutionTypeChange: (v: ResolutionType | null) => void;
  onSideALabelChange: (v: string) => void;
  onSideBLabelChange: (v: string) => void;
  disabled?: boolean;
}

export function EventBaseFields({
  category,
  resolutionType,
  sideALabel,
  sideBLabel,
  onCategoryChange,
  onResolutionTypeChange,
  onSideALabelChange,
  onSideBLabelChange,
  disabled = false,
}: EventBaseFieldsProps) {
  const fixedResolution = category ? FIXED_RESOLUTION[category] : undefined;
  const allowedResolutions = category ? CATEGORY_RESOLUTION_MAP[category] : [];

  const handleCategoryChange = (value: string) => {
    const cat = value as Category;
    onCategoryChange(cat);
    // Auto-set fixed resolution types
    const fixed = FIXED_RESOLUTION[cat];
    if (fixed) {
      onResolutionTypeChange(fixed);
    } else {
      onResolutionTypeChange(null);
    }
  };

  return (
    <>
      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">
          Category
          <span className="text-red-400 ml-0.5">*</span>
        </Label>
        <Select
          value={category ?? ""}
          onValueChange={handleCategoryChange}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-secondary/50 border-border text-foreground text-xs"
          >
            <SelectValue placeholder="Select category…" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resolution Type */}
      {category && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            Resolution Type
            <span className="text-red-400 ml-0.5">*</span>
          </Label>
          {fixedResolution ? (
            <div className="flex h-8 items-center rounded-md border border-border bg-secondary/30 px-2.5 text-xs text-muted-foreground">
              {RESOLUTION_TYPE_LABELS[fixedResolution]}
              <span className="ml-2 text-[10px] opacity-60">(fixed for {CATEGORY_LABELS[category]})</span>
            </div>
          ) : (
            <Select
              value={resolutionType ?? ""}
              onValueChange={(v) => onResolutionTypeChange(v as ResolutionType)}
              disabled={disabled}
            >
              <SelectTrigger
                size="sm"
                className="w-full bg-secondary/50 border-border text-foreground text-xs"
              >
                <SelectValue placeholder="Select resolution type…" />
              </SelectTrigger>
              <SelectContent>
                {allowedResolutions.map((rt) => (
                  <SelectItem key={rt} value={rt} className="text-xs">
                    {RESOLUTION_TYPE_LABELS[rt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Side labels */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="side-a-label" className="text-xs font-medium">
            Side A Label
            <span className="text-red-400 ml-0.5">*</span>
          </Label>
          <Input
            id="side-a-label"
            value={sideALabel}
            onChange={(e) => onSideALabelChange(e.target.value)}
            disabled={disabled}
            placeholder={category ? SIDE_A_PLACEHOLDERS[category] : "e.g. Yes"}
            className="bg-secondary/50 border-border text-foreground text-xs h-8"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="side-b-label" className="text-xs font-medium">
            Side B Label
            <span className="text-red-400 ml-0.5">*</span>
          </Label>
          <Input
            id="side-b-label"
            value={sideBLabel}
            onChange={(e) => onSideBLabelChange(e.target.value)}
            disabled={disabled}
            placeholder={category ? SIDE_B_PLACEHOLDERS[category] : "e.g. No"}
            className="bg-secondary/50 border-border text-foreground text-xs h-8"
          />
        </div>
      </div>
    </>
  );
}
