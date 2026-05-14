import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useProjectAnalysisStore,
  getFilteredPackages,
  getHealthSummary,
  type AnalyzedPackage,
} from "./project-analysis-store";
import type { AnalysisResponse } from "@/app/api/analyze/route";
import type { HealthLevel, HealthScore } from "@/modules/packages";

const score = (overall: number, level: HealthLevel = "healthy"): HealthScore => ({
  overall,
  level,
  breakdown: {
    maintenance: overall,
    popularity: overall,
    activity: overall,
    security: overall,
    size: overall,
  },
  vulnerabilities: [],
  bundle: null,
  lastPublish: "2024-01-01",
  weeklyDownloads: 1000,
  openIssues: 0,
  closedIssues: 0,
});

const analysis = (): AnalysisResponse => ({
  projectName: "demo",
  projectVersion: "1.0.0",
  dependencies: ["react", "lodash"],
  devDependencies: ["vitest", "lodash"], // lodash appears in both — dedupe expected
  healthScores: {
    react: score(95, "healthy"),
    lodash: score(60, "warning"),
    vitest: score(20, "critical"),
  },
  analyzedAt: new Date().toISOString(),
});

describe("useProjectAnalysisStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useProjectAnalysisStore());
    act(() => result.current.clear());
    vi.clearAllMocks();
  });

  it("should have empty initial state", () => {
    const { result } = renderHook(() => useProjectAnalysisStore());
    expect(result.current.analysis).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sortBy).toBe("risk");
    expect(result.current.filterBy).toBe("all");
  });

  it("should populate analysis on successful fetch", async () => {
    const data = analysis();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => data,
    } as Response);

    const { result } = renderHook(() => useProjectAnalysisStore());

    await act(async () => {
      await result.current.analyze("{}");
    });

    expect(result.current.analysis).toEqual(data);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should set error on failed fetch", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "boom", code: "NO_DEPS" }),
    } as Response);

    const { result } = renderHook(() => useProjectAnalysisStore());

    await act(async () => {
      await result.current.analyze("{}");
    });

    expect(result.current.error).toBe("boom");
    expect(result.current.analysis).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should set error on network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useProjectAnalysisStore());

    await act(async () => {
      await result.current.analyze("{}");
    });

    expect(result.current.error).toBe("network down");
  });

  it("clear should reset state", async () => {
    const data = analysis();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => data,
    } as Response);

    const { result } = renderHook(() => useProjectAnalysisStore());

    await act(async () => {
      await result.current.analyze("{}");
    });
    expect(result.current.analysis).not.toBeNull();

    act(() => result.current.clear());
    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should update sortBy and filterBy", () => {
    const { result } = renderHook(() => useProjectAnalysisStore());

    act(() => result.current.setSortBy("name"));
    act(() => result.current.setFilterBy("critical"));

    expect(result.current.sortBy).toBe("name");
    expect(result.current.filterBy).toBe("critical");
  });

  it("isLoading should toggle during analyze", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.mocked(global.fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { result } = renderHook(() => useProjectAnalysisStore());

    act(() => {
      result.current.analyze("{}");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => analysis(),
      } as Response);
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("getFilteredPackages", () => {
  it("returns empty array when analysis is null", () => {
    expect(getFilteredPackages(null, "risk", "all")).toEqual([]);
  });

  it("flattens deps and devDeps without duplicating shared packages", () => {
    const packages = getFilteredPackages(analysis(), "name", "all");
    const names = packages.map((p) => p.name);

    expect(names).toEqual(["lodash", "react", "vitest"]);
    expect(names.filter((n) => n === "lodash")).toHaveLength(1);
  });

  it("marks devDeps with isDev=true when not also a runtime dep", () => {
    const packages = getFilteredPackages(analysis(), "name", "all");
    const lodash = packages.find((p) => p.name === "lodash");
    const vitest = packages.find((p) => p.name === "vitest");

    expect(lodash?.isDev).toBe(false);
    expect(vitest?.isDev).toBe(true);
  });

  it("filters by health level", () => {
    expect(getFilteredPackages(analysis(), "name", "critical")).toHaveLength(1);
    expect(getFilteredPackages(analysis(), "name", "warning")).toHaveLength(1);
    expect(getFilteredPackages(analysis(), "name", "healthy")).toHaveLength(1);
  });

  it("filters by runtime vs dev deps", () => {
    const deps = getFilteredPackages(analysis(), "name", "deps");
    const devDeps = getFilteredPackages(analysis(), "name", "devDeps");

    expect(deps.map((p) => p.name)).toEqual(["lodash", "react"]);
    expect(devDeps.map((p) => p.name)).toEqual(["vitest"]);
  });

  it("sorts by risk (lowest score first)", () => {
    const packages = getFilteredPackages(analysis(), "risk", "all");
    expect(packages.map((p) => p.healthScore.overall)).toEqual([20, 60, 95]);
  });

  it("sorts by health (highest score first)", () => {
    const packages = getFilteredPackages(analysis(), "health", "all");
    expect(packages.map((p) => p.healthScore.overall)).toEqual([95, 60, 20]);
  });
});

describe("getHealthSummary", () => {
  it("returns null for an empty list", () => {
    expect(getHealthSummary([])).toBeNull();
  });

  it("computes average score and distribution", () => {
    const packages: AnalyzedPackage[] = [
      { name: "a", healthScore: score(90, "healthy"), isDev: false },
      { name: "b", healthScore: score(60, "warning"), isDev: false },
      { name: "c", healthScore: score(30, "critical"), isDev: false },
    ];

    const summary = getHealthSummary(packages);
    expect(summary).not.toBeNull();
    expect(summary!.totalCount).toBe(3);
    expect(summary!.averageScore).toBe(60);
    expect(summary!.averageLevel).toBe("warning");
    expect(summary!.distribution.healthy).toBe(1);
    expect(summary!.distribution.warning).toBe(1);
    expect(summary!.distribution.critical).toBe(1);
  });

  it("lists riskiest packages first, up to 5", () => {
    const packages: AnalyzedPackage[] = [
      { name: "a", healthScore: score(90, "healthy"), isDev: false },
      { name: "b", healthScore: score(10, "critical"), isDev: false },
      { name: "c", healthScore: score(50, "warning"), isDev: false },
    ];

    const summary = getHealthSummary(packages)!;
    expect(summary.riskiestPackages.map((p) => p.name)).toEqual(["b", "c", "a"]);
  });
});
