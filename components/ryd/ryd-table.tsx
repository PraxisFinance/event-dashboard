"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { formatUnits } from "viem";

interface RydRow {
  id: string;
  address: string;
  name: string;
  description: string | null;
  vault: string;
  numWinners: number;
  minDeposit: string;
  endTime: Date | string;
  txHash: string | null;
  createdAt: Date | string;
}

interface RydTableProps {
  rows: RydRow[];
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

export function RydTable({ rows }: RydTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-medium text-foreground">No RYD contracts deployed yet</p>
        <p className="text-xs text-muted-foreground">
          Click "Deploy RYD" to create the first one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contract</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vault</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Winners</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Min Deposit</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ends</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tx</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deployed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const endDate = new Date(row.endTime);
            const createdDate = new Date(row.createdAt);
            const minDepositUsdc = (() => {
              try {
                return formatUnits(BigInt(row.minDeposit), 6);
              } catch {
                return row.minDeposit;
              }
            })();

            return (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 hover:bg-secondary/20 transition-colors ${
                  i % 2 === 0 ? "" : "bg-secondary/10"
                }`}
              >
                {/* Name + description */}
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{row.name}</p>
                  {row.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 max-w-48">
                      {row.description}
                    </p>
                  )}
                </td>

                {/* Contract address */}
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
                  <a
                    href={basescanAddr(row.vault)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {shortAddr(row.vault)}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </td>

                {/* Winners */}
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {row.numWinners}
                </td>

                {/* Min deposit */}
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {Number(minDepositUsdc).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  USDC
                </td>

                {/* End time */}
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{endDate.toLocaleDateString()}</p>
                  <p className="opacity-60">
                    {endDate > new Date()
                      ? `in ${formatDistanceToNow(endDate)}`
                      : `${formatDistanceToNow(endDate)} ago`}
                  </p>
                </td>

                {/* Tx hash */}
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

                {/* Created at */}
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDistanceToNow(createdDate, { addSuffix: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
