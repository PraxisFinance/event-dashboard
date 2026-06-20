"use client";

import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/primitives/label";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Button } from "@/components/ui/primitives/button";
import type { EventMetadata } from "@/lib/types/event-market";
import { cls } from "./shared";

interface Props {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function PoliticsTechFields({ metadata, onChange, disabled }: Props) {
  const paragraphs = metadata.resolutionParagraphs ?? [""];

  const updateParagraph = (idx: number, value: string) => {
    const next = [...paragraphs];
    next[idx] = value;
    onChange({ resolutionParagraphs: next });
  };

  const addParagraph = () => {
    onChange({ resolutionParagraphs: [...paragraphs, ""] });
  };

  const removeParagraph = (idx: number) => {
    if (paragraphs.length <= 1) return;
    onChange({ resolutionParagraphs: paragraphs.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className={cls.label}>
        Resolution Rules
        <span className={cls.required}>*</span>
        <span className="text-muted-foreground font-normal ml-1">(2–3 paragraphs)</span>
      </Label>
      {paragraphs.map((p, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <Textarea
            value={p}
            onChange={(e) => updateParagraph(idx, e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder={`Paragraph ${idx + 1}…`}
            className="bg-secondary/50 border-border text-foreground text-xs resize-none flex-1"
          />
          {paragraphs.length > 1 && (
            <button
              type="button"
              onClick={() => removeParagraph(idx)}
              disabled={disabled}
              className="mt-1 text-muted-foreground hover:text-red-400 disabled:opacity-50 transition-colors"
              aria-label="Remove paragraph"
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
        onClick={addParagraph}
        disabled={disabled || paragraphs.length >= 4}
        className="h-7 gap-1 text-xs border-border text-muted-foreground hover:text-foreground w-fit"
      >
        <Plus className="h-3 w-3" />
        Add paragraph
      </Button>
    </div>
  );
}
