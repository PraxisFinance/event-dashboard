"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data-display/table";
import { type PredictionEvent, formatTimestamp } from "@/lib/mock-data";
import { ExternalLink } from "lucide-react";

interface EventsTableProps {
  events: PredictionEvent[];
  onCreateMarket: (event: PredictionEvent) => void;
}

function StatusBadge({ status }: { status: PredictionEvent["status"] }) {
  if (status === "open")
    return (
      <Badge className="bg-brand-green/15 text-brand-green border-brand-green/30 hover:bg-brand-green/20 text-xs font-medium">
        Open
      </Badge>
    );
  if (status === "resolved")
    return (
      <Badge className="bg-secondary text-muted-foreground border-border hover:bg-secondary text-xs font-medium">
        Resolved
      </Badge>
    );
  return (
    <Badge className="bg-brand-red/15 text-brand-red border-brand-red/30 hover:bg-brand-red/20 text-xs font-medium">
      Cancelled
    </Badge>
  );
}

function SourceBadge({ source }: { source: PredictionEvent["source"] }) {
  if (source === "source")
    return (
      <Badge className="bg-brand-blue/15 text-brand-blue border-brand-blue/30 hover:bg-brand-blue/20 text-xs font-medium">
        Source
      </Badge>
    );
  return (
    <Badge className="bg-brand-purple/15 text-brand-purple border-brand-purple/30 hover:bg-brand-purple/20 text-xs font-medium">
      Praxis
    </Badge>
  );
}

export function EventsTable({ events, onCreateMarket }: EventsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-medium w-80 py-3">
                Title
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Source
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Type
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Categories
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium py-3">
                Expires
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-right py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="border-border hover:bg-secondary/50 cursor-pointer transition-colors"
              >
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-sm font-medium text-foreground hover:text-muted-foreground leading-snug line-clamp-2"
                    >
                      {event.title}
                    </Link>
                    {event.onPlatform && (
                      <Badge className="w-fit bg-brand-green/15 text-brand-green border-brand-green/30 text-xs font-medium px-1.5 py-0">
                        On Platform
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge status={event.status} />
                </TableCell>
                <TableCell className="py-3">
                  <SourceBadge source={event.source} />
                </TableCell>
                <TableCell className="py-3">
                  {event.marketType ? (
                    <span className="text-xs text-muted-foreground">
                      {event.marketType}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  {event.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {event.categories.slice(0, 2).map((c) => (
                        <Badge
                          key={c}
                          className="bg-secondary text-muted-foreground border-border text-[10px] px-1.5 py-0 font-normal"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(event.expirationTimestamp)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right">
                  {event.onPlatform ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                      asChild
                    >
                      <a
                        href={`https://basescan.org/tx/${event.contractTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Tx
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateMarket(event);
                      }}
                    >
                      Create on Platform
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
