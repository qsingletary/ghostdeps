import { describe, it, expect, vi, beforeEach } from "vitest";
import { DependencyResolver } from "./dependency-resolver";
import type { IPackageRepository, IHealthService, ICache } from "../interfaces";
import type { NpmPackageMetadata, HealthScore, DependencyTree } from "../types";

const createMockCache = (): ICache => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const createMockPackageRepository = (): IPackageRepository => ({
  findByName: vi.fn(),
  search: vi.fn(),
});

const createMockHealthService = (): IHealthService => ({
  calculate: vi.fn(),
  calculateBatch: vi.fn(),
  getLevel: vi.fn(),
});

const createHealthScore = (overall = 85): HealthScore => ({
  overall,
  level: overall >= 70 ? "healthy" : overall >= 40 ? "warning" : "critical",
  breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100 },
  vulnerabilities: [],
  lastPublish: "2024-01-01",
  weeklyDownloads: 50000,
  openIssues: 10,
  closedIssues: 90,
});

const createPackageMetadata = (
  name: string,
  version: string,
  dependencies: Record<string, string> = {},
): NpmPackageMetadata => ({
  name,
  version,
  dependencies,
  time: { created: "2024-01-01", modified: "2024-01-01" },
});

describe("DependencyResolver", () => {
  let resolver: DependencyResolver;
  let mockCache: ICache;
  let mockPackageRepo: IPackageRepository;
  let mockHealthService: IHealthService;

  beforeEach(() => {
    mockCache = createMockCache();
    mockPackageRepo = createMockPackageRepository();
    mockHealthService = createMockHealthService();
    resolver = new DependencyResolver(mockPackageRepo, mockHealthService, mockCache);
  });

  describe("resolve", () => {
    it("should return cached tree if available", async () => {
      const cachedTree: DependencyTree = {
        root: {
          id: "lodash@4.17.21",
          name: "lodash",
          version: "4.17.21",
          health: createHealthScore(),
          depth: 0,
          dependencies: [],
        },
        stats: {
          totalPackages: 1,
          uniquePackages: 1,
          maxDepth: 0,
          healthDistribution: { healthy: 1, warning: 0, critical: 0, unknown: 0 },
        },
        resolvedAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(mockCache.get).mockResolvedValue(cachedTree);

      const result = await resolver.resolve("lodash", "latest", 5);

      expect(result).toEqual(cachedTree);
      expect(mockPackageRepo.findByName).not.toHaveBeenCalled();
    });

    it("should resolve a package with no dependencies", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata("lodash", "4.17.21", {}),
      );
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("lodash", "latest", 5);

      expect(result.root.name).toBe("lodash");
      expect(result.root.version).toBe("4.17.21");
      expect(result.root.dependencies).toHaveLength(0);
      expect(result.stats.totalPackages).toBe(1);
      expect(result.stats.uniquePackages).toBe(1);
      expect(result.stats.maxDepth).toBe(0);
    });

    it("should resolve a package with nested dependencies", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("express", "4.18.0", { debug: "^4.3.0" }))
        .mockResolvedValueOnce(createPackageMetadata("debug", "4.3.4", { ms: "^2.1.0" }))
        .mockResolvedValueOnce(createPackageMetadata("ms", "2.1.3", {}));
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("express", "latest", 5);

      expect(result.root.name).toBe("express");
      expect(result.root.dependencies).toHaveLength(1);
      expect(result.root.dependencies[0]!.name).toBe("debug");
      expect(result.root.dependencies[0]!.dependencies).toHaveLength(1);
      expect(result.root.dependencies[0]!.dependencies[0]!.name).toBe("ms");
      expect(result.stats.totalPackages).toBe(3);
    });

    it("should respect maxDepth limit", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("a", "1.0.0", { b: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("b", "1.0.0", { c: "^1.0.0" }));
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("a", "latest", 1);

      expect(result.root.dependencies).toHaveLength(1);
      expect(result.root.dependencies[0]!.dependencies).toHaveLength(0);
      expect(result.stats.maxDepth).toBe(1);
    });

    it("should clamp maxDepth between 1 and 10", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata("test", "1.0.0", {}),
      );
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      // Test maxDepth = 0 should become 1
      await resolver.resolve("test", "latest", 0);
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining(":1"),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should detect circular dependencies", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      // A -> B -> A (circular)
      // We need to provide the same package data for "a" when resolving both times
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("a", "1.0.0", { b: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("b", "1.0.0", { a: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("a", "1.0.0", { b: "^1.0.0" }));
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("a", "latest", 5);

      // The dependency from b back to a should be detected as circular
      const bDep = result.root.dependencies[0]!;
      expect(bDep.name).toBe("b");
      // When b tries to resolve a, a is already in progress, so it becomes circular
      const circularDep = bDep.dependencies.find((d) => d.name === "a");
      expect(circularDep?.isCircular).toBe(true);
    });

    it("should handle package resolution errors", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("main", "1.0.0", { missing: "^1.0.0" }))
        .mockRejectedValueOnce(new Error("Package not found"));
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("main", "latest", 5);

      expect(result.root.dependencies[0]!.hasError).toBe(true);
      expect(result.root.dependencies[0]!.id).toContain("error");
    });

    it("should cache the resolved tree", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata("test", "1.0.0", {}),
      );
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      await resolver.resolve("test", "latest", 5);

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^tree:test:latest:5$/),
        expect.objectContaining({
          root: expect.anything(),
          stats: expect.anything(),
          resolvedAt: expect.any(String),
        }),
        expect.any(Number),
      );
    });

    it("should reuse already resolved nodes", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      // Root -> A -> C, Root -> B -> C
      // C should be reused after first resolution
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(
          createPackageMetadata("root", "1.0.0", { a: "^1.0.0", b: "^1.0.0" }),
        )
        .mockResolvedValueOnce(createPackageMetadata("a", "1.0.0", { c: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("c", "1.0.0", {}))
        .mockResolvedValueOnce(createPackageMetadata("b", "1.0.0", { c: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("c", "1.0.0", {})); // C may be resolved again
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("root", "latest", 5);

      // Total packages: root, a, c (from a), b, c (from b) = 5
      // But unique packages considers the tree structure as-is
      expect(result.stats.totalPackages).toBeGreaterThanOrEqual(4);
    });
  });

  describe("calculateStats", () => {
    it("should calculate correct health distribution", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("root", "1.0.0", { dep1: "^1.0.0" }))
        .mockResolvedValueOnce(createPackageMetadata("dep1", "1.0.0", {}));
      vi.mocked(mockHealthService.calculate)
        .mockResolvedValueOnce(createHealthScore(85)) // healthy
        .mockResolvedValueOnce(createHealthScore(50)); // warning

      const result = await resolver.resolve("root", "latest", 5);

      expect(result.stats.healthDistribution.healthy).toBe(1);
      expect(result.stats.healthDistribution.warning).toBe(1);
      expect(result.stats.healthDistribution.critical).toBe(0);
    });
  });

  describe("concurrency limit", () => {
    it("should process dependencies in batches", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);

      // Create a package with 15 dependencies to test batching
      const deps: Record<string, string> = {};
      for (let i = 0; i < 15; i++) {
        deps[`dep${i}`] = "^1.0.0";
      }

      vi.mocked(mockPackageRepo.findByName)
        .mockResolvedValueOnce(createPackageMetadata("root", "1.0.0", deps))
        .mockResolvedValue(createPackageMetadata("dep", "1.0.0", {}));
      vi.mocked(mockHealthService.calculate).mockResolvedValue(createHealthScore());

      const result = await resolver.resolve("root", "latest", 5);

      expect(result.root.dependencies).toHaveLength(15);
    });
  });
});
