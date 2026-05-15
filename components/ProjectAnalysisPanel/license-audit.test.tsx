import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import LicenseAudit from "./license-audit";
import { useProjectAnalysisStore } from "@/stores/project-analysis-store";
import type { AnalysisResponse } from "@/app/api/analyze/route";
import type { HealthScore, LicenseCategory } from "@/modules/packages";

const score = (
  spdx: string,
  category: LicenseCategory,
  overall = 80,
): HealthScore => ({
  overall,
  level: overall >= 70 ? "healthy" : "warning",
  breakdown: {
    maintenance: 80,
    popularity: 80,
    activity: 80,
    security: 80,
    size: 80,
  },
  vulnerabilities: [],
  bundle: null,
  license: { spdx, category },
  lastPublish: "2024-01-01",
  weeklyDownloads: 1000,
  openIssues: 0,
  closedIssues: 0,
});

const seedAnalysis = (analysis: AnalysisResponse) => {
  const { result } = renderHook(() => useProjectAnalysisStore());
  act(() => {
    result.current.clear();
  });
  act(() => {
    useProjectAnalysisStore.setState({
      analysis,
      isLoading: false,
      error: null,
      sortBy: "name",
      filterBy: "all",
    });
  });
};

describe("LicenseAudit", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useProjectAnalysisStore());
    act(() => result.current.clear());
  });

  it("renders nothing when there is no analysis", () => {
    const { container } = render(<LicenseAudit />);
    expect(container.firstChild).toBeNull();
  });

  it("renders distribution counts for every license category", () => {
    seedAnalysis({
      projectName: "demo",
      dependencies: ["a", "b", "c", "d"],
      devDependencies: ["e"],
      healthScores: {
        a: score("MIT", "permissive"),
        b: score("MPL-2.0", "weak-copyleft"),
        c: score("GPL-3.0", "strong-copyleft"),
        d: score("UNLICENSED", "proprietary"),
        e: score("", "unknown"),
      },
      analyzedAt: new Date().toISOString(),
    });

    render(<LicenseAudit />);

    expect(screen.getByText("License audit")).toBeInTheDocument();
    expect(screen.getByText("Permissive")).toBeInTheDocument();
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("Propriet.")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("lists strong-copyleft, proprietary, and unknown packages in the flagged section", () => {
    seedAnalysis({
      projectName: "demo",
      dependencies: ["safe", "gpl", "prop", "huh"],
      devDependencies: [],
      healthScores: {
        safe: score("MIT", "permissive"),
        gpl: score("GPL-3.0", "strong-copyleft"),
        prop: score("UNLICENSED", "proprietary"),
        huh: score("", "unknown"),
      },
      analyzedAt: new Date().toISOString(),
    });

    render(<LicenseAudit />);

    expect(screen.getByText(/Flagged \(3\)/)).toBeInTheDocument();
    expect(screen.getByText("gpl")).toBeInTheDocument();
    expect(screen.getByText("prop")).toBeInTheDocument();
    expect(screen.getByText("huh")).toBeInTheDocument();
    expect(screen.queryByText("safe")).not.toBeInTheDocument();
  });

  it("does not show the flagged block when no packages are flagged", () => {
    seedAnalysis({
      projectName: "demo",
      dependencies: ["a", "b"],
      devDependencies: [],
      healthScores: {
        a: score("MIT", "permissive"),
        b: score("Apache-2.0", "permissive"),
      },
      analyzedAt: new Date().toISOString(),
    });

    render(<LicenseAudit />);

    expect(screen.queryByText(/Flagged/)).not.toBeInTheDocument();
  });

  it("marks dev-only packages with a 'dev' tag in the flagged list", () => {
    seedAnalysis({
      projectName: "demo",
      dependencies: [],
      devDependencies: ["gpl-dev"],
      healthScores: {
        "gpl-dev": score("AGPL-3.0", "strong-copyleft"),
      },
      analyzedAt: new Date().toISOString(),
    });

    render(<LicenseAudit />);

    expect(screen.getByText("dev")).toBeInTheDocument();
  });

  it("truncates the flagged list to 8 with a '+ N more' marker", () => {
    const deps = Array.from({ length: 12 }, (_, i) => `pkg-${i}`);
    const healthScores: Record<string, HealthScore> = {};
    for (const name of deps) {
      healthScores[name] = score("GPL-3.0", "strong-copyleft");
    }

    seedAnalysis({
      projectName: "demo",
      dependencies: deps,
      devDependencies: [],
      healthScores,
      analyzedAt: new Date().toISOString(),
    });

    render(<LicenseAudit />);

    expect(screen.getByText(/Flagged \(12\)/)).toBeInTheDocument();
    expect(screen.getByText("+ 4 more")).toBeInTheDocument();
  });
});
