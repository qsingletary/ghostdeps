"use client";

import {
  useProjectAnalysisStore,
  type SortBy,
  type FilterBy,
} from "@/stores/project-analysis-store";

export default function FilterControls() {
  const sortBy = useProjectAnalysisStore((s) => s.sortBy);
  const filterBy = useProjectAnalysisStore((s) => s.filterBy);
  const setSortBy = useProjectAnalysisStore((s) => s.setSortBy);
  const setFilterBy = useProjectAnalysisStore((s) => s.setFilterBy);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted">Sort:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus:border-accent focus:outline-none"
        >
          <option value="risk">Riskiest first</option>
          <option value="health">Healthiest first</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted">Filter:</label>
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterBy)}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs focus:border-accent focus:outline-none"
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="healthy">Healthy</option>
          <option value="deps">Dependencies only</option>
          <option value="devDeps">DevDeps only</option>
        </select>
      </div>
    </div>
  );
}
