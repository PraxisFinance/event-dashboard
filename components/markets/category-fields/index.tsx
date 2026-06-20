"use client";

import type { Category, EventMetadata } from "@/lib/types/event-market";
import { CryptoFields } from "./crypto";
import { FinanceFields } from "./finance";
import { EsportsFields } from "./esports";
import { SportFields } from "./sport";
import { PoliticsTechFields } from "./politics-tech";

interface EventCategoryFieldsProps {
  category: Category;
  metadata: EventMetadata;
  onMetadataChange: (patch: Partial<EventMetadata>) => void;
  disabled?: boolean;
}

export function EventCategoryFields({
  category,
  metadata,
  onMetadataChange,
  disabled,
}: EventCategoryFieldsProps) {
  switch (category) {
    case "crypto":
      return (
        <CryptoFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />
      );
    case "finance":
      return (
        <FinanceFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />
      );
    case "esports":
      return (
        <EsportsFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />
      );
    case "sport":
      return (
        <SportFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />
      );
    case "politics":
    case "tech":
      return (
        <PoliticsTechFields metadata={metadata} onChange={onMetadataChange} disabled={disabled} />
      );
    default:
      return null;
  }
}
