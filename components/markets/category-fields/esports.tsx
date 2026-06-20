"use client";

import { Input } from "@/components/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import {
  ESPORT_GAME_OPTIONS,
  type EsportGameId,
  type EventMetadata,
} from "@/lib/types/event-market";
import { cls, Field, TeamFields } from "./shared";

interface Props {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function EsportsFields({ metadata, onChange, disabled }: Props) {
  return (
    <>
      <Field label="Game" required>
        <Select
          value={metadata.gameId ?? ""}
          onValueChange={(v) => onChange({ gameId: v as EsportGameId })}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-secondary/50 border-border text-foreground text-xs"
          >
            <SelectValue placeholder="Select game…" />
          </SelectTrigger>
          <SelectContent>
            {ESPORT_GAME_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value} className="text-xs">
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <TeamFields
        prefix="A"
        name={metadata.teamAName ?? ""}
        logoUrl={metadata.teamALogoUrl ?? ""}
        onNameChange={(v) => onChange({ teamAName: v })}
        onLogoChange={(v) => onChange({ teamALogoUrl: v })}
        disabled={disabled}
      />
      <TeamFields
        prefix="B"
        name={metadata.teamBName ?? ""}
        logoUrl={metadata.teamBLogoUrl ?? ""}
        onNameChange={(v) => onChange({ teamBName: v })}
        onLogoChange={(v) => onChange({ teamBLogoUrl: v })}
        disabled={disabled}
      />
      <Field label="Stream URL" hint="Optional — live stream link">
        <Input
          value={metadata.streamUrl ?? ""}
          onChange={(e) => onChange({ streamUrl: e.target.value || undefined })}
          disabled={disabled}
          placeholder="https://twitch.tv/…"
          className={cls.input}
        />
      </Field>
    </>
  );
}
