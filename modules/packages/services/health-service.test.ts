import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthService } from "./health-service";
import type { IPackageRepository, INpmsClient, ICache } from "../interfaces";
import type { NpmPackageMetadata, NpmsPackageData, HealthScore } from "../types";

// Mock implementations
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

const createNpmsData = (overrides: Partial<NpmsPackageData> = {}): NpmsPackageData => ({
  score: 0.8,
  quality: 0.7,
  popularity: 0.6,
  maintenance: 0.9,
  downloads: { weekly: 100000 },
  vulnerabilities: [],
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

describe("HealthService", () => {
  let service: HealthService;
  let mockCache: ICache;
  let mockPackageRepo: IPackageRepository;
  let mockNpmsClient: INpmsClient;

  beforeEach(() => {
    mockCache = createMockCache();
    mockPackageRepo = createMockPackageRepository();
    mockNpmsClient = createMockNpmsClient();
    service = new HealthService(mockPackageRepo, mockNpmsClient, mockCache);
  });

  describe("calculate", () => {
    it("should return cached score if available", async () => {
      const cachedScore: HealthScore = {
        overall: 85,
        level: "healthy",
        breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100 },
        vulnerabilities: [],
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
    });

    it("should fetch and compute score when not cached", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(createNpmsData());

      const result = await service.calculate("test-package");

      expect(mockPackageRepo.findByName).toHaveBeenCalledWith("test-package");
      expect(mockNpmsClient.fetchScore).toHaveBeenCalledWith("test-package");
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("breakdown");
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
        breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100 },
        vulnerabilities: [],
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

      const result = await service.calculateBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(mockNpmsClient.fetchScoresBatch).toHaveBeenCalledWith(["lodash", "react"]);
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
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({ vulnerabilities: [] }),
      );

      const result = await service.calculate("secure-package");

      expect(result.breakdown.security).toBe(100);
    });

    it("should deduct 40 points for critical vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          vulnerabilities: [{ id: "1", severity: "critical", title: "Test" }],
        }),
      );

      const result = await service.calculate("critical-vuln-package");

      expect(result.breakdown.security).toBe(60);
    });

    it("should deduct 25 points for high vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          vulnerabilities: [{ id: "1", severity: "high", title: "Test" }],
        }),
      );

      const result = await service.calculate("high-vuln-package");

      expect(result.breakdown.security).toBe(75);
    });

    it("should not go below 0 for many vulnerabilities", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockPackageRepo.findByName).mockResolvedValue(createPackageMetadata());
      vi.mocked(mockNpmsClient.fetchScore).mockResolvedValue(
        createNpmsData({
          vulnerabilities: [
            { id: "1", severity: "critical", title: "Test1" },
            { id: "2", severity: "critical", title: "Test2" },
            { id: "3", severity: "critical", title: "Test3" },
          ],
        }),
      );

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

  describe("overall score calculation", () => {
    it("should weight scores correctly (40% maint, 20% pop, 20% act, 20% sec)", async () => {
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
          vulnerabilities: [],
        }),
      );

      const result = await service.calculate("perfect-package");

      // Maintenance: 100, Popularity: 100, Activity: 50, Security: 100
      // Overall: 100*0.4 + 100*0.2 + 50*0.2 + 100*0.2 = 40 + 20 + 10 + 20 = 90
      expect(result.overall).toBe(90);
      expect(result.level).toBe("healthy");
    });
  });
});
