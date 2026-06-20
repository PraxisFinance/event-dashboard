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
  SPORT_DISCIPLINE_OPTIONS,
  type EventMetadata,
  type SportDisciplineId,
} from "@/lib/types/event-market";
import { cls, Field, TeamFields } from "./shared";

interface Props {
  metadata: EventMetadata;
  onChange: (p: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function SportFields({ metadata, onChange, disabled }: Props) {
  return (
    <>
      <Field label="Discipline" required>
        <Select
          value={metadata.disciplineId ?? ""}
          onValueChange={(v) => onChange({ disciplineId: v as SportDisciplineId })}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-secondary/50 border-border text-foreground text-xs"
          >
            <SelectValue placeholder="Select discipline…" />
          </SelectTrigger>
          <SelectContent>
            {SPORT_DISCIPLINE_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-xs">
                {d.label}
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
          placeholder="https://…"
          className={cls.input}
        />
      </Field>
      <Field label="Resolution Deadline Label" required hint="e.g. June 23, 2026">
        <Input
          value={metadata.resolutionDeadlineLabel ?? ""}
          onChange={(e) => onChange({ resolutionDeadlineLabel: e.target.value })}
          disabled={disabled}
          placeholder="June 23, 2026"
          className={cls.input}
        />
      </Field>
    </>
  );
}
