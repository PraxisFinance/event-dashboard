import { Card } from "@/components/ui/layout/card";
import type { PredictionEvent } from "@/lib/mock-data";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card className="bg-card border-border p-6">
      <p className="text-3xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-foreground mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </Card>
  );
}

/** Stats from Praxis events loaded via tRPC (`events.list` → mapped rows). */
export function StatCards({ events }: { events: PredictionEvent[] }) {
  const total = events.length;
  const onPlatform = events.filter((e) => e.onPlatform).length;
  const openMarkets = events.filter((e) => e.status === "open").length;
  const pendingImport = total - onPlatform;

  const stats: StatCardProps[] = [
    { label: "Total Events", value: total, description: "Non-expired Praxis-native events" },
    { label: "On Platform", value: onPlatform, description: "Events deployed to Praxis smart contract" },
    { label: "Open Markets", value: openMarkets, description: "Events with status open" },
    { label: "Not Deployed", value: pendingImport, description: "Pending deployment" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
