"use client";

import { useMemo } from "react";
import {
  categoryLabel,
  classifyLicense,
  type LicenseCategory,
} from "@/modules/packages";
import {
  useProjectAnalysisStore,
  getFilteredPackages,
  type AnalyzedPackage,
} from "@/stores/project-analysis-store";

interface LicenseSummary {
  distribution: Record<LicenseCategory, number>;
  flagged: Array<{
    name: string;
    spdx: string;
    category: LicenseCategory;
    isDev: boolean;
  }>;
  total: number;
}

const FLAG_CATEGORIES: LicenseCategory[] = [
  "strong-copyleft",
  "proprietary",
  "unknown",
];

export default function LicenseAudit() {
  const analysis = useProjectAnalysisStore((s) => s.analysis);
  const sortBy = useProjectAnalysisStore((s) => s.sortBy);
  const filterBy = useProjectAnalysisStore((s) => s.filterBy);

  const summary = useMemo<LicenseSummary | null>(() => {
    const packages = getFilteredPackages(analysis, sortBy, filterBy);
    if (packages.length === 0) return null;
    return buildSummary(packages);
  }, [analysis, sortBy, filterBy]);

  if (!summary) return null;

  return (
    <div>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs">
        License audit
      </h3>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        <CategoryCount
          category="permissive"
          count={summary.distribution.permissive}
        />
        <CategoryCount
          category="weak-copyleft"
          count={summary.distribution["weak-copyleft"]}
        />
        <CategoryCount
          category="strong-copyleft"
          count={summary.distribution["strong-copyleft"]}
        />
        <CategoryCount
          category="proprietary"
          count={summary.distribution.proprietary}
        />
        <CategoryCount
          category="unknown"
          count={summary.distribution.unknown}
        />
      </div>

      {summary.flagged.length > 0 && (
        <div className="mt-3 rounded-xl border border-critical/20 bg-critical/5 p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold text-critical">
            Flagged ({summary.flagged.length})
          </p>
          <div className="space-y-1.5">
            {summary.flagged.slice(0, 8).map((pkg) => (
              <FlaggedRow key={pkg.name} pkg={pkg} />
            ))}
            {summary.flagged.length > 8 && (
              <p className="text-[10px] text-muted">
                + {summary.flagged.length - 8} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCount({
  category,
  count,
}: {
  category: LicenseCategory;
  count: number;
}) {
  const colorClass = colorForCategory(category);
  return (
    <div
      className={`rounded-lg p-2 text-center ${colorClass}`}
      title={categoryLabel(category)}
    >
      <p className="text-base font-bold sm:text-lg">{count}</p>
      <p className="text-[9px] uppercase tracking-wide opacity-80 sm:text-[10px]">
        {shortLabel(category)}
      </p>
    </div>
  );
}

function FlaggedRow({
  pkg,
}: {
  pkg: { name: string; spdx: string; category: LicenseCategory; isDev: boolean };
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{pkg.name}</span>
        {pkg.isDev && (
          <span className="flex-shrink-0 rounded bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            dev
          </span>
        )}
      </div>
      <span
        className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${colorForCategory(pkg.category)}`}
        title={categoryLabel(pkg.category)}
      >
        {pkg.spdx || "—"}
      </span>
    </div>
  );
}

function colorForCategory(category: LicenseCategory): string {
  switch (category) {
    case "permissive":
      return "bg-healthy/10 text-healthy";
    case "weak-copyleft":
      return "bg-warning/10 text-warning";
    case "strong-copyleft":
    case "proprietary":
      return "bg-critical/10 text-critical";
    case "unknown":
      return "bg-muted/10 text-muted";
  }
}

function shortLabel(category: LicenseCategory): string {
  switch (category) {
    case "permissive":
      return "Permissive";
    case "weak-copyleft":
      return "Weak";
    case "strong-copyleft":
      return "Strong";
    case "proprietary":
      return "Propriet.";
    case "unknown":
      return "Unknown";
  }
}

function buildSummary(packages: AnalyzedPackage[]): LicenseSummary {
  const distribution: Record<LicenseCategory, number> = {
    permissive: 0,
    "weak-copyleft": 0,
    "strong-copyleft": 0,
    proprietary: 0,
    unknown: 0,
  };
  const flagged: LicenseSummary["flagged"] = [];

  for (const pkg of packages) {
    const license =
      pkg.healthScore.license ?? classifyLicense(undefined);
    distribution[license.category]++;

    if (FLAG_CATEGORIES.includes(license.category)) {
      flagged.push({
        name: pkg.name,
        spdx: license.spdx,
        category: license.category,
        isDev: pkg.isDev,
      });
    }
  }

  return {
    distribution,
    flagged,
    total: packages.length,
  };
}
