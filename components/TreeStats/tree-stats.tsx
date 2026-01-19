import type { TreeStats as TreeStatsType } from "@/modules/packages";

interface TreeStatsProps {
  stats: TreeStatsType;
}

export default function TreeStats({ stats }: TreeStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <Stat label="Packages" value={stats.totalPackages} />
      <Stat label="Unique" value={stats.uniquePackages} />
      <Stat label="Depth" value={stats.maxDepth} />

      <div className="flex items-center gap-3">
        <HealthDot
          color="bg-healthy"
          count={stats.healthDistribution.healthy}
        />
        <HealthDot
          color="bg-warning"
          count={stats.healthDistribution.warning}
        />
        <HealthDot
          color="bg-critical"
          count={stats.healthDistribution.critical}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function HealthDot({ color, count }: { color: string; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted">{count}</span>
    </div>
  );
}
