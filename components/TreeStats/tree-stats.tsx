import type { TreeStats as TreeStatsType } from "@/modules/packages";

interface TreeStatsProps {
  stats: TreeStatsType;
}

export default function TreeStats({ stats }: TreeStatsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <StatPill
          label="Packages"
          value={stats.totalPackages}
          icon={<PackageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
        />
        <StatPill
          label="Unique"
          value={stats.uniquePackages}
          icon={<LayersIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
        />
        <StatPill
          label="Depth"
          value={stats.maxDepth}
          icon={<GitBranchIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
        />
      </div>

      <div className="hidden h-6 w-px bg-border sm:block" />

      <div className="flex items-center gap-3 sm:gap-3">
        <HealthStat
          color="bg-healthy"
          count={stats.healthDistribution.healthy}
          label="Healthy"
        />
        <HealthStat
          color="bg-warning"
          count={stats.healthDistribution.warning}
          label="Warning"
        />
        <HealthStat
          color="bg-critical"
          count={stats.healthDistribution.critical}
          label="Critical"
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
      <span className="text-accent">{icon}</span>
      <span className="text-[10px] text-muted sm:text-xs">{label}</span>
      <span className="text-xs font-bold sm:text-sm">{value}</span>
    </div>
  );
}

function HealthStat({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-1.5 sm:gap-2" title={label}>
      <span className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${color}`} />
      <span className="text-xs font-medium sm:text-sm">{count}</span>
    </div>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.29 7 12 12l8.71-5M12 22V12" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
    </svg>
  );
}

function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
