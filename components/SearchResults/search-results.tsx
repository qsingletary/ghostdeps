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
    <div className="animate-slide-up absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-hidden overflow-y-auto rounded-2xl border border-border/50 bg-surface/95 shadow-xl backdrop-blur-xl">
      <div className="p-2">
        {results.map((pkg, index) => (
          <button
            key={pkg.name}
            onClick={() => onSelect(pkg.name)}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-accent/10 sm:px-4 sm:py-3"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white sm:h-9 sm:w-9">
              <svg
                className="h-4 w-4"
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
            </div>

            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {pkg.name}
              </span>
              {pkg.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                  {pkg.description}
                </p>
              )}
            </div>

            <span className="flex-shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-muted sm:px-2.5 sm:py-1">
              {pkg.version}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
