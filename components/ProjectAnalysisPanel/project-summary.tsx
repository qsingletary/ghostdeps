"use client";

import { useMemo } from "react";
import {
  useProjectAnalysisStore,
  getFilteredPackages,
  getHealthSummary,
} from "@/stores/project-analysis-store";
import { HealthBadge } from "@/components";

export default function ProjectSummary() {
  const analysis = useProjectAnalysisStore((s) => s.analysis);
  const sortBy = useProjectAnalysisStore((s) => s.sortBy);
  const filterBy = useProjectAnalysisStore((s) => s.filterBy);

  const summary = useMemo(() => {
    const packages = getFilteredPackages(analysis, sortBy, filterBy);
    return getHealthSummary(packages);
  }, [analysis, sortBy, filterBy]);

  if (!summary) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
        <HealthBadge
          score={summary.averageScore}
          level={summary.averageLevel}
          size="md"
        />
        <div>
          <p className="text-sm font-semibold">Project Health</p>
          <p className="text-xs text-muted">
            Average across {summary.totalCount} packages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <DistributionBadge
          label="Healthy"
          count={summary.distribution.healthy}
          colorClass="bg-healthy/10 text-healthy"
        />
        <DistributionBadge
          label="Warning"
          count={summary.distribution.warning}
          colorClass="bg-warning/10 text-warning"
        />
        <DistributionBadge
          label="Critical"
          count={summary.distribution.critical}
          colorClass="bg-critical/10 text-critical"
        />
        <DistributionBadge
          label="Unknown"
          count={summary.distribution.unknown}
          colorClass="bg-muted/10 text-muted"
        />
      </div>

      {summary.riskiestPackages.length > 0 &&
        (summary.riskiestPackages[0]?.healthScore.overall ?? 100) < 70 && (
          <div className="rounded-xl border border-critical/20 bg-critical/5 p-3">
            <p className="mb-2 text-xs font-semibold text-critical">
              Riskiest Packages
            </p>
            <div className="space-y-1.5">
              {summary.riskiestPackages.slice(0, 3).map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate font-medium">{pkg.name}</span>
                  <span className="ml-2 flex-shrink-0 text-muted">
                    {pkg.healthScore.overall}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

function DistributionBadge({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className={`rounded-lg p-2 text-center ${colorClass}`}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
