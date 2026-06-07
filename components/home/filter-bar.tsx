"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";

export interface FilterState {
  search: string;
  status: string;
  source?: string;
  platform: string;
  sort: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  hideSourceFilter?: boolean;
}

export function FilterBar({ filters, onFilterChange, hideSourceFilter = false }: FilterBarProps) {
  const update = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="pl-8 h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Status filter */}
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 w-36 text-xs bg-secondary border-border text-foreground">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
          <SelectItem value="open" className="text-xs">Open</SelectItem>
          <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
          <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Source filter — hidden on pages that scope by source already */}
      {!hideSourceFilter && (
        <Select value={filters.source ?? "all"} onValueChange={(v) => update("source", v)}>
          <SelectTrigger className="h-8 w-36 text-xs bg-secondary border-border text-foreground">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all" className="text-xs">All Sources</SelectItem>
            <SelectItem value="source" className="text-xs">Source</SelectItem>
            <SelectItem value="praxis" className="text-xs">Praxis</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Platform filter */}
      <Select value={filters.platform} onValueChange={(v) => update("platform", v)}>
        <SelectTrigger className="h-8 w-40 text-xs bg-secondary border-border text-foreground">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="all" className="text-xs">All</SelectItem>
          <SelectItem value="on" className="text-xs">On Platform</SelectItem>
          <SelectItem value="off" className="text-xs">Not on Platform</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
        <SelectTrigger className="h-8 w-44 text-xs bg-secondary border-border text-foreground">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="newest" className="text-xs">Newest</SelectItem>
          <SelectItem value="expiration" className="text-xs">Expiration Date</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
