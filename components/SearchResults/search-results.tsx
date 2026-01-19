"use client";

import type { PackageSearchResult } from "@/modules/packages";

interface SearchResultsProps {
  results: PackageSearchResult[];
  onSelect: (name: string) => void;
  visible: boolean;
}

export default function SearchResults({
  results,
  onSelect,
  visible,
}: SearchResultsProps) {
  if (!visible || results.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-bg">
      {results.map((pkg) => (
        <button
          key={pkg.name}
          onClick={() => onSelect(pkg.name)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-fg/5"
        >
          <span className="font-medium">{pkg.name}</span>
          <span className="text-xs text-muted">{pkg.version}</span>
        </button>
      ))}
    </div>
  );
}
