"use client";

import { HealthBadge } from "@/components";
import type { AnalyzedPackage } from "@/stores/project-analysis-store";

interface PackageListProps {
  packages: AnalyzedPackage[];
  onSelectPackage: (name: string) => void;
}

export default function PackageList({
  packages,
  onSelectPackage,
}: PackageListProps) {
  if (packages.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">No packages match the filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.name}
          pkg={pkg}
          onSelect={() => onSelectPackage(pkg.name)}
        />
      ))}
    </div>
  );
}

function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: AnalyzedPackage;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left transition-colors hover:bg-surface/80"
    >
      <div className="flex-shrink-0">
        <HealthBadge
          score={pkg.healthScore.overall}
          level={pkg.healthScore.level}
          size="sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{pkg.name}</p>
          {pkg.isDev && (
            <span className="flex-shrink-0 rounded bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              dev
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Score: {pkg.healthScore.overall} · {pkg.healthScore.level}
        </p>
      </div>
      <ArrowIcon className="h-4 w-4 flex-shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function ArrowIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
