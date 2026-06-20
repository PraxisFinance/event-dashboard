"use client";

import { Input } from "@/components/ui/primitives/input";
import type { EventMetadata } from "@/lib/types/event-market";
import { cls, Field } from "./shared";

interface Props {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function CryptoFields({ metadata, onChange, disabled }: Props) {
  return (
    <>
      <Field label="Asset Symbol" required hint="e.g. ETH">
        <Input
          value={metadata.assetSymbol ?? ""}
          onChange={(e) => onChange({ assetSymbol: e.target.value })}
          disabled={disabled}
          placeholder="ETH"
          className={cls.input}
        />
      </Field>
      <Field label="Resolution Asset Label" required hint="e.g. ETH (Pyth ETH/USD)">
        <Input
          value={metadata.resolutionAssetLabel ?? ""}
          onChange={(e) => onChange({ resolutionAssetLabel: e.target.value })}
          disabled={disabled}
          placeholder="ETH (Pyth ETH/USD)"
          className={cls.input}
        />
      </Field>
      <Field label="Resolution Reference Date" required hint="e.g. February 26, 2026">
        <Input
          value={metadata.resolutionReferenceDateLabel ?? ""}
          onChange={(e) => onChange({ resolutionReferenceDateLabel: e.target.value })}
          disabled={disabled}
          placeholder="February 26, 2026"
          className={cls.input}
        />
      </Field>
    </>
  );
}
