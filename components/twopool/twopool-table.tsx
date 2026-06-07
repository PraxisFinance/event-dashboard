"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";

interface TwoPoolRow {
  id: string;
  address: string;
  name: string;
  description: string | null;
  vault: string;
  yt: string | null;
  curve: string;
  targetRate: string;
  startTime: Date | string;
  endTime: Date | string;
  txHash: string | null;
  createdAt: Date | string;
}

interface TwoPoolTableProps {
  rows: TwoPoolRow[];
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function basescanTx(hash: string) {
  return `https://sepolia.basescan.org/tx/${hash}`;
}

function basescanAddr(addr: string) {
  return `https://sepolia.basescan.org/address/${addr}`;
}

function AddrLink({ addr }: { addr: string }) {
  return (
    <a
      href={basescanAddr(addr)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors"
    >
      {shortAddr(addr)}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}

export function TwoPoolTable({ rows }: TwoPoolTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-medium text-foreground">No two-pool campaigns deployed yet</p>
        <p className="text-xs text-muted-foreground">
          Click "Deploy Two-Pool" to create the first one.
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pool</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vault</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">YT</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Curve</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Target Rate</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tx</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const startDate = new Date(row.startTime);
            const endDate = new Date(row.endTime);
            const isActive = startDate <= now && endDate > now;
            const isPending = startDate > now;
            const isEnded = endDate <= now;

            return (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 hover:bg-secondary/20 transition-colors ${
                  i % 2 === 0 ? "" : "bg-secondary/10"
                }`}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{row.name}</p>
                  {row.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 max-w-40">
                      {row.description}
                    </p>
                  )}
                </td>

                {/* Pool address */}
                <td className="px-4 py-3">
                  <a
                    href={basescanAddr(row.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-foreground hover:text-brand-green transition-colors"
                  >
                    {shortAddr(row.address)}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </td>

                {/* Vault */}
                <td className="px-4 py-3">
                  <AddrLink addr={row.vault} />
                </td>

                {/* YT */}
                <td className="px-4 py-3">
                  {row.yt ? (
                    <AddrLink addr={row.yt} />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Curve */}
                <td className="px-4 py-3">
                  <AddrLink addr={row.curve} />
                </td>

                {/* Target rate */}
                <td className="px-4 py-3 text-right tabular-nums font-mono text-foreground">
                  {row.targetRate}
                </td>

                {/* Period */}
                <td className="px-4 py-3 text-muted-foreground min-w-32">
                  <p>{startDate.toLocaleDateString()} →</p>
                  <p>{endDate.toLocaleDateString()}</p>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {isActive && (
                    <Badge className="bg-brand-green/20 text-brand-green border-brand-green/30 text-xs font-normal">
                      Active · ends {formatDistanceToNow(endDate)}
                    </Badge>
                  )}
                  {isPending && (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs font-normal">
                      Starts {formatDistanceToNow(startDate, { addSuffix: true })}
                    </Badge>
                  )}
                  {isEnded && (
                    <Badge className="bg-secondary text-muted-foreground border-border text-xs font-normal">
                      Ended
                    </Badge>
                  )}
                </td>

                {/* Tx */}
                <td className="px-4 py-3">
                  {row.txHash ? (
                    <a
                      href={basescanTx(row.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {shortAddr(row.txHash)}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
