"use client";

import { Input } from "@/components/ui/primitives/input";
import type { EventMetadata } from "@/lib/types/event-market";
import { cls, Field } from "./shared";

interface Props {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function FinanceFields({ metadata, onChange, disabled }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Asset Name" required hint="e.g. Meta">
          <Input
            value={metadata.assetName ?? ""}
            onChange={(e) => onChange({ assetName: e.target.value })}
            disabled={disabled}
            placeholder="Meta"
            className={cls.input}
          />
        </Field>
        <Field label="Asset Ticker" required hint="e.g. META">
          <Input
            value={metadata.assetTicker ?? ""}
            onChange={(e) => onChange({ assetTicker: e.target.value })}
            disabled={disabled}
            placeholder="META"
            className={cls.input}
          />
        </Field>
      </div>
      <Field label="Resolution Asset Label" required hint="e.g. Meta (Pyth META/USD)">
        <Input
          value={metadata.resolutionAssetLabel ?? ""}
          onChange={(e) => onChange({ resolutionAssetLabel: e.target.value })}
          disabled={disabled}
          placeholder="Meta (Pyth META/USD)"
          className={cls.input}
        />
      </Field>
      <Field label="Resolution Source Label" required hint="e.g. Pyth META/USD price feed">
        <Input
          value={metadata.resolutionSourceLabel ?? ""}
          onChange={(e) => onChange({ resolutionSourceLabel: e.target.value })}
          disabled={disabled}
          placeholder="Pyth META/USD price feed"
          className={cls.input}
        />
      </Field>
      <Field label="Resolution Reference Date" required hint="e.g. June 23, 2026">
        <Input
          value={metadata.resolutionReferenceDateLabel ?? ""}
          onChange={(e) => onChange({ resolutionReferenceDateLabel: e.target.value })}
          disabled={disabled}
          placeholder="June 23, 2026"
          className={cls.input}
        />
      </Field>
    </>
  );
}
