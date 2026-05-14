import { create } from "zustand";
import type { HealthScore, HealthLevel } from "@/modules/packages";
import type { AnalysisResponse } from "@/app/api/analyze/route";

export type SortBy = "risk" | "health" | "name";
export type FilterBy =
  | "all"
  | "critical"
  | "warning"
  | "healthy"
  | "deps"
  | "devDeps";

export interface AnalyzedPackage {
  name: string;
  healthScore: HealthScore;
  isDev: boolean;
}

interface ProjectAnalysisState {
  analysis: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  sortBy: SortBy;
  filterBy: FilterBy;
  analyze: (content: string) => Promise<void>;
  clear: () => void;
  setSortBy: (sortBy: SortBy) => void;
  setFilterBy: (filterBy: FilterBy) => void;
}

export interface HealthSummary {
  averageScore: number;
  averageLevel: HealthLevel;
  distribution: Record<HealthLevel, number>;
  riskiestPackages: AnalyzedPackage[];
  totalCount: number;
}

export const useProjectAnalysisStore = create<ProjectAnalysisState>()(
  (set) => ({
    analysis: null,
    isLoading: false,
    error: null,
    sortBy: "risk",
    filterBy: "all",

    analyze: async (content: string) => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageJson: content }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze package.json");
        }

        set({ analysis: data as AnalysisResponse, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        });
      }
    },

    clear: () => set({ analysis: null, error: null, isLoading: false }),

    setSortBy: (sortBy: SortBy) => set({ sortBy }),

    setFilterBy: (filterBy: FilterBy) => set({ filterBy }),
  }),
);

// Pure functions for derived data - use with useMemo in components
export function getFilteredPackages(
  analysis: AnalysisResponse | null,
  sortBy: SortBy,
  filterBy: FilterBy,
): AnalyzedPackage[] {
  if (!analysis) return [];

  const packages: AnalyzedPackage[] = [];

  for (const name of analysis.dependencies) {
    const healthScore = analysis.healthScores[name];
    if (healthScore) {
      packages.push({ name, healthScore, isDev: false });
    }
  }

  for (const name of analysis.devDependencies) {
    if (!analysis.dependencies.includes(name)) {
      const healthScore = analysis.healthScores[name];
      if (healthScore) {
        packages.push({ name, healthScore, isDev: true });
      }
    }
  }

  const filtered = packages.filter((pkg) => {
    switch (filterBy) {
      case "critical":
        return pkg.healthScore.level === "critical";
      case "warning":
        return pkg.healthScore.level === "warning";
      case "healthy":
        return pkg.healthScore.level === "healthy";
      case "deps":
        return !pkg.isDev;
      case "devDeps":
        return pkg.isDev;
      default:
        return true;
    }
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "risk":
        return a.healthScore.overall - b.healthScore.overall;
      case "health":
        return b.healthScore.overall - a.healthScore.overall;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

export function getHealthSummary(
  packages: AnalyzedPackage[],
): HealthSummary | null {
  if (packages.length === 0) return null;

  const distribution: Record<HealthLevel, number> = {
    healthy: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
  };

  let totalScore = 0;

  for (const pkg of packages) {
    distribution[pkg.healthScore.level]++;
    totalScore += pkg.healthScore.overall;
  }

  const averageScore = Math.round(totalScore / packages.length);
  const averageLevel = getLevel(averageScore);

  const riskiestPackages = [...packages]
    .sort((a, b) => a.healthScore.overall - b.healthScore.overall)
    .slice(0, 5);

  return {
    averageScore,
    averageLevel,
    distribution,
    riskiestPackages,
    totalCount: packages.length,
  };
}

function getLevel(score: number): HealthLevel {
  if (score >= 70) return "healthy";
  if (score >= 40) return "warning";
  if (score > 0) return "critical";
  return "unknown";
}
