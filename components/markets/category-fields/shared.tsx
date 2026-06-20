"use client";

import { Label } from "@/components/ui/primitives/label";
import { Input } from "@/components/ui/primitives/input";

export const cls = {
  field: "flex flex-col gap-1.5",
  label: "text-xs font-medium",
  input: "bg-secondary/50 border-border text-foreground text-xs h-8",
  required: "text-red-400 ml-0.5",
  hint: "text-[10px] text-muted-foreground",
};

export function Req() {
  return <span className={cls.required}>*</span>;
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cls.field}>
      <Label className={cls.label}>
        {label}
        {required && <Req />}
      </Label>
      {children}
      {hint && <p className={cls.hint}>{hint}</p>}
    </div>
  );
}

export function TeamFields({
  prefix,
  name,
  logoUrl,
  onNameChange,
  onLogoChange,
  disabled,
}: {
  prefix: "A" | "B";
  name: string;
  logoUrl: string;
  onNameChange: (v: string) => void;
  onLogoChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Team {prefix}
      </p>
      <Field label="Name" required>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          placeholder={`Team ${prefix} name`}
          className={cls.input}
        />
      </Field>
      <Field label="Logo URL" required hint="Direct image URL or CDN link">
        <Input
          value={logoUrl}
          onChange={(e) => onLogoChange(e.target.value)}
          disabled={disabled}
          placeholder="https://…"
          className={cls.input}
        />
      </Field>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`Team ${prefix} logo preview`}
          className="h-8 w-8 rounded object-contain bg-secondary/40 border border-border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
