import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthService } from "./health-service";
import type {
  IPackageRepository,
  INpmsClient,
  IOsvClient,
  IBundleClient,
  ICache,
} from "../interfaces";
import type {
  NpmPackageMetadata,
  NpmsPackageData,
  HealthScore,
  Vulnerability,
  BundleSize,
} from "../types";

const createMockCache = (): ICache => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const createMockPackageRepository = (): IPackageRepository => ({
  findByName: vi.fn(),
  search: vi.fn(),
});

const createMockNpmsClient = (): INpmsClient => ({
  fetchScore: vi.fn(),
  fetchScoresBatch: vi.fn(),
});

const createMockOsvClient = (): IOsvClient => ({
  fetchVulnerabilities: vi.fn().mockResolvedValue([]),
  fetchVulnerabilitiesBatch: vi.fn().mockResolvedValue(new Map()),
});

const createMockBundleClient = (): IBundleClient => ({
  fetchBundleSize: vi.fn().mockResolvedValue(null),
  fetchBundleSizesBatch: vi.fn().mockResolvedValue(new Map()),
});

const createBundle = (
  overrides: Partial<BundleSize> = {},
): BundleSize => ({
  minified: 50_000,
  gzipped: 20_000,
  dependencyCount: 0,
  hasJSModule: true,
  hasSideEffects: false,
  isModuleType: true,
  ...overrides,
});

const createNpmsData = (
  overrides: Partial<NpmsPackageData> = {},
): NpmsPackageData => ({
  score: 0.8,
  quality: 0.7,
  popularity: 0.6,
  maintenance: 0.9,
  downloads: { weekly: 100000 },
  ...overrides,
});

const createPackageMetadata = (
  overrides: Partial<NpmPackageMetadata> = {},
): NpmPackageMetadata => ({
  name: "test-package",
  version: "1.0.0",
  dependencies: {},
  time: {
    created: "2024-01-01T00:00:00Z",
    modified: new Date().toISOString(),
  },
  ...overrides,
});

const createVuln = (
  severity: Vulnerability["severity"],
  overrides: Partial<Vulnerability> = {},
): Vulnerability => ({
  id: `GHSA-${severity}-${Math.random().toString(36).slice(2, 6)}`,
  aliases: [],
  summary: `${severity} test vuln`,
  severity,
  affectedRanges: [],
  patchedVersions: [],
  references: [],
  ...overrides,
});

describe("HealthService", () => {
  let service: HealthService;
  let mockCache: ICache;
  let mockPackageRepo: IPackageRepository;
  let mockNpmsClient: INpmsClient;
  let mockOsvClient: IOsvClient;
  let mockBundleClient: IBundleClient;

  beforeEach(() => {
    mockCache = createMockCache();
    mockPackageRepo = createMockPackageRepository();
    mockNpmsClient = createMockNpmsClient();
    mockOsvClient = createMockOsvClient();
    mockBundleClient = createMockBundleClient();
    service = new HealthService(
      mockPackageRepo,
      mockNpmsClient,
      mockOsvClient,
      mockBundleClient,
      mockCache,
    );
  });

  describe("calculate", () => {
    it("should return cached score if available", async () => {
      const cachedScore: HealthScore = {
        overall: 85,
        level: "healthy",
        breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100, size: 90 },
        vulnerabilities: [],
        bundle: null,
        license: { spdx: "MIT", category: "permissive" },
        lastPublish: "2024-01-01",
        weeklyDownloads: 50000,
        openIssues: 10,
        closedIssues: 90,
      };
      vi.mocked(mockCache.get).mockResolvedValue(cachedScore);

      const result = await service.calculate("lodash");

      expect(result).toEqual(cachedScore);
      expect(mockPackageRepo.findByName).not.toHaveBeenCalled();
      expect(mockNpmsClient.fetchScore).not.toHaveBeenCalled();
      expect(mockOsvClient.fetchVulnerabilities).not.toHaveBeenCalled();
    });

    it("uses a version-specific cache key when a concrete version is given", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      await service.calculate("lodash", "4.17.20");

      expect(mockCache.get).toHaveBeenCalledWith("health:lodash:4.17.20");
      expect(mockCache.set).toHaveBeenCalledWith(
        "health:lodash:4.17.20",
        expect.anything(),
        expect.anything(),
      );
    });

    it("passes the version through to the OSV client", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      await service.calculate("lodash", "4.17.20");

      expect(mockOsvClient.fetchVulnerabilities).toHaveBeenCalledWith(
        "lodash",
        "4.17.20",
      );
    });

    it("should fetch and compute score when not cached", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("test-package");

      expect(mockPackageRepo.findByName).toHaveBeenCalledWith("test-package");
      expect(mockNpmsClient.fetchScore).toHaveBeenCalledWith("test-package");
      expect(mockOsvClient.fetchVulnerabilities).toHaveBeenCalledWith(
        "test-package",
        undefined,
      );
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("breakdown");
    });

    it("attaches vulnerabilities from OSV to the resulting health score", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      const vulns = [createVuln("high"), createVuln("low")];
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue(vulns);

      const result = await service.calculate("test-package");

      expect(result.vulnerabilities).toEqual(vulns);
    });

    it("should handle package repository errors gracefully", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockRejectedValue(new Error("Not found"));
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("unknown-package");

      expect(result).toHaveProperty("overall");
      expect(result.breakdown.maintenance).toBe(50); // Unknown = neutral
    });
  });

  describe("calculateBatch", () => {
    it("should return cached scores for all cached packages", async () => {
      const cachedScore: HealthScore = {
        overall: 85,
        level: "healthy",
        breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100, size: 90 },
        vulnerabilities: [],
        bundle: null,
        license: { spdx: "MIT", category: "permissive" },
        lastPublish: "",
        weeklyDownloads: 0,
        openIssues: 0,
        closedIssues: 0,
      };
      vi.mocked(mockCache.get).mockResolvedValue(cachedScore);

      const result = await service.calculateBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(result.get("lodash")).toEqual(cachedScore);
      expect(mockNpmsClient.fetchScoresBatch).not.toHaveBeenCalled();
      expect(mockOsvClient.fetchVulnerabilitiesBatch).not.toHaveBeenCalled();
      expect(mockBundleClient.fetchBundleSizesBatch).not.toHaveBeenCalled();
    });

    it("should fetch uncached packages in batch", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScoresBatch).mockResolvedValue(
        new Map([
          ["lodash", createNpmsData()],
          ["react", createNpmsData()],
        ]),
      );
      vi.mocked(mockOsvClient.fetchVulnerabilitiesBatch).mockResolvedValue(
        new Map([
          ["lodash", [createVuln("critical")]],
          ["react", []],
        ]),
      );
      const lodashBundle = createBundle({ gzipped: 24_000 });
      vi.mocked(mockBundleClient.fetchBundleSizesBatch).mockResolvedValue(
        new Map([
          ["lodash", lodashBundle],
          ["react", null],
        ]),
      );

      const result = await service.calculateBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(mockNpmsClient.fetchScoresBatch).toHaveBeenCalledWith(["lodash", "react"]);
      expect(mockOsvClient.fetchVulnerabilitiesBatch).toHaveBeenCalledWith([
        { name: "lodash" },
        { name: "react" },
      ]);
      expect(mockBundleClient.fetchBundleSizesBatch).toHaveBeenCalledWith([
        { name: "lodash" },
        { name: "react" },
      ]);
      expect(result.get("lodash")!.vulnerabilities).toHaveLength(1);
      expect(result.get("lodash")!.bundle).toEqual(lodashBundle);
      expect(result.get("react")!.vulnerabilities).toHaveLength(0);
      expect(result.get("react")!.bundle).toBeNull();
    });
  });

  describe("getLevel", () => {
    it("should return 'healthy' for scores >= 70", () => {
      expect(service.getLevel(70)).toBe("healthy");
      expect(service.getLevel(85)).toBe("healthy");
      expect(service.getLevel(100)).toBe("healthy");
    });

    it("should return 'warning' for scores >= 40 and < 70", () => {
      expect(service.getLevel(40)).toBe("warning");
      expect(service.getLevel(55)).toBe("warning");
      expect(service.getLevel(69)).toBe("warning");
    });

    it("should return 'critical' for scores > 0 and < 40", () => {
      expect(service.getLevel(1)).toBe("critical");
      expect(service.getLevel(20)).toBe("critical");
      expect(service.getLevel(39)).toBe("critical");
    });

    it("should return 'unknown' for score of 0", () => {
      expect(service.getLevel(0)).toBe("unknown");
    });
  });

  describe("maintenance score calculation", () => {
    it("should return 100 for packages modified within 30 days", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({
          time: { created: "2024-01-01", modified: recentDate.toISOString() },
        }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("fresh-package");

      expect(result.breakdown.maintenance).toBe(100);
    });

    it("should return 50 for packages with no modification date", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({ time: undefined }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("unknown-date-package");

      expect(result.breakdown.maintenance).toBe(50);
    });

    it("should return lower scores for older packages", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // Over a year old
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({
          time: { created: "2020-01-01", modified: oldDate.toISOString() },
        }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("old-package");

      expect(result.breakdown.maintenance).toBeLessThan(20);
    });
  });

  describe("popularity score calculation", () => {
    it("should return 0 for packages with 0 downloads", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({ downloads: { weekly: 0 } }),
      );

      const result = await service.calculate("no-downloads");

      expect(result.breakdown.popularity).toBe(0);
    });

    it("should return 10 for packages with < 10 downloads", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({ downloads: { weekly: 5 } }),
      );

      const result = await service.calculate("few-downloads");

      expect(result.breakdown.popularity).toBe(10);
    });

    it("should return 100 for packages with 1M+ downloads", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({ downloads: { weekly: 1000000 } }),
      );

      const result = await service.calculate("popular-package");

      expect(result.breakdown.popularity).toBe(100);
    });
  });

  describe("security score calculation", () => {
    it("should return 100 for packages with no vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue([]);

      const result = await service.calculate("secure-package");

      expect(result.breakdown.security).toBe(100);
    });

    it("should deduct 40 points for critical vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue([
        createVuln("critical"),
      ]);

      const result = await service.calculate("critical-vuln-package");

      expect(result.breakdown.security).toBe(60);
    });

    it("should deduct 25 points for high vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue([
        createVuln("high"),
      ]);

      const result = await service.calculate("high-vuln-package");

      expect(result.breakdown.security).toBe(75);
    });

    it("stacks severity penalties from multiple vulns", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue([
        createVuln("high"),
        createVuln("moderate"),
        createVuln("low"),
      ]);

      const result = await service.calculate("multi-vuln-package");

      // 100 - 25 - 10 - 5 = 60
      expect(result.breakdown.security).toBe(60);
    });

    it("should not go below 0 for many vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockOsvClient.fetchVulnerabilities).mockResolvedValue([
        createVuln("critical"),
        createVuln("critical"),
        createVuln("critical"),
      ]);

      const result = await service.calculate("many-vulns-package");

      expect(result.breakdown.security).toBe(0);
    });
  });

  describe("activity score calculation", () => {
    it("should return 50 for packages with no issues", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          github: { issues: { openCount: 0, totalCount: 0 } },
        }),
      );

      const result = await service.calculate("no-issues-package");

      expect(result.breakdown.activity).toBe(50);
    });

    it("should give bonus for packages with many resolved issues", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          github: { issues: { openCount: 5, totalCount: 100 } },
        }),
      );

      const result = await service.calculate("active-package");

      // 95% closed ratio = 85.5 + 10 bonus = ~96
      expect(result.breakdown.activity).toBeGreaterThan(90);
    });

    it("should use maintenance score when no github data", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          github: undefined,
          maintenance: 0.75,
        }),
      );

      const result = await service.calculate("no-github-package");

      expect(result.breakdown.activity).toBe(75);
    });
  });

  describe("size score calculation", () => {
    it("returns 50 (neutral) when no bundle data is available", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(null);

      const result = await service.calculate("no-bundle");
      expect(result.breakdown.size).toBe(50);
      expect(result.bundle).toBeNull();
    });

    it("scores tiny gzipped bundles (<=10KB) at 100, plus tree-shake bonus is capped at 100", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(
        createBundle({ gzipped: 5_000, hasJSModule: true, hasSideEffects: false }),
      );

      const result = await service.calculate("tiny");
      expect(result.breakdown.size).toBe(100);
    });

    it("scores mid-size bundles around 30KB lower than tiny ones", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(
        createBundle({
          gzipped: 30 * 1024,
          hasJSModule: false,
          hasSideEffects: true,
        }),
      );

      const result = await service.calculate("mid");
      // 30KB → 100 - ((30-10)/40)*20 = 90, no tree-shake bonus
      expect(result.breakdown.size).toBe(90);
    });

    it("scores huge bundles (>500KB) close to zero", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(
        createBundle({
          gzipped: 800 * 1024,
          hasJSModule: false,
          hasSideEffects: true,
        }),
      );

      const result = await service.calculate("huge");
      // 800KB → 20 - ((800-500)/500)*20 = 8, no tree-shake bonus
      expect(result.breakdown.size).toBeLessThan(15);
    });

    it("adds the tree-shake bonus when ESM + no side effects", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(
        createBundle({
          gzipped: 30 * 1024,
          hasJSModule: true,
          hasSideEffects: false,
        }),
      );

      const result = await service.calculate("tree-shakable");
      // 90 + 5 bonus = 95
      expect(result.breakdown.size).toBe(95);
    });

    it("passes the version through to the bundle client", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      await service.calculate("lodash", "4.17.21");

      expect(mockBundleClient.fetchBundleSize).toHaveBeenCalledWith(
        "lodash",
        "4.17.21",
      );
    });

    it("attaches the bundle data to the resulting health score", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());
      const bundle = createBundle({ gzipped: 12_345 });
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(bundle);

      const result = await service.calculate("with-bundle");
      expect(result.bundle).toEqual(bundle);
    });
  });

  describe("license", () => {
    it("populates license info from package metadata", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({ license: "Apache-2.0" }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("apache-pkg");

      expect(result.license).toEqual({
        spdx: "Apache-2.0",
        category: "permissive",
      });
    });

    it("classifies GPL packages as strong-copyleft", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({ license: "GPL-3.0-or-later" }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("gpl-pkg");

      expect(result.license.category).toBe("strong-copyleft");
    });

    it("defaults to unknown when package.json has no license field", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({ license: undefined }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("nolicense");

      expect(result.license).toEqual({ spdx: "", category: "unknown" });
    });
  });

  describe("overall score calculation", () => {
    it("weights scores: 30% maint, 10% pop, 15% act, 30% sec, 15% size", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(
        createPackageMetadata({
          time: { created: "2024-01-01", modified: new Date().toISOString() },
        }),
      );
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          downloads: { weekly: 1000000 },
          github: { issues: { openCount: 0, totalCount: 0 } },
        }),
      );
      vi.mocked(mockBundleClient.fetchBundleSize).mockResolvedValue(
        createBundle({
          gzipped: 5_000,
          hasJSModule: false,
          hasSideEffects: true,
        }),
      );

      const result = await service.calculate("perfect-package");

      // Maintenance: 100, Popularity: 100, Activity: 50, Security: 100, Size: 100
      // 100*0.30 + 100*0.10 + 50*0.15 + 100*0.30 + 100*0.15 = 30 + 10 + 7.5 + 30 + 15 = 92.5 → 93
      expect(result.overall).toBe(93);
      expect(result.level).toBe("healthy");
    });
  });
});
