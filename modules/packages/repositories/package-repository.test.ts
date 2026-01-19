import { describe, it, expect, vi, beforeEach } from "vitest";
import { PackageRepository } from "./package-repository";
import type { ICache, INpmClient } from "../interfaces";
import type { NpmPackageMetadata, PackageSearchResult } from "../types";

const createMockCache = (): ICache => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

const createMockNpmClient = (): INpmClient => ({
  fetchPackage: vi.fn(),
  searchPackages: vi.fn(),
});

const createPackageMetadata = (name = "test"): NpmPackageMetadata => ({
  name,
  version: "1.0.0",
  dependencies: {},
  time: { created: "2024-01-01", modified: "2024-01-01" },
});

const createSearchResult = (name = "test"): PackageSearchResult => ({
  name,
  version: "1.0.0",
  description: "Test package",
  score: 0.8,
});

describe("PackageRepository", () => {
  let repository: PackageRepository;
  let mockCache: ICache;
  let mockNpmClient: INpmClient;

  beforeEach(() => {
    mockCache = createMockCache();
    mockNpmClient = createMockNpmClient();
    repository = new PackageRepository(mockCache, mockNpmClient);
  });

  describe("findByName", () => {
    it("should return cached package if available", async () => {
      const cachedData = createPackageMetadata("lodash");
      vi.mocked(mockCache.get).mockResolvedValue(cachedData);

      const result = await repository.findByName("lodash");

      expect(result).toEqual(cachedData);
      expect(mockNpmClient.fetchPackage).not.toHaveBeenCalled();
    });

    it("should fetch from npm client when not cached", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const packageData = createPackageMetadata("lodash");
      vi.mocked(mockNpmClient.fetchPackage).mockResolvedValue(packageData);

      const result = await repository.findByName("lodash");

      expect(result).toEqual(packageData);
      expect(mockNpmClient.fetchPackage).toHaveBeenCalledWith("lodash", "latest");
    });

    it("should cache fetched package", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const packageData = createPackageMetadata("lodash");
      vi.mocked(mockNpmClient.fetchPackage).mockResolvedValue(packageData);

      await repository.findByName("lodash");

      expect(mockCache.set).toHaveBeenCalledWith(
        "pkg:lodash:latest",
        packageData,
        3600, // PACKAGE TTL
      );
    });

    it("should respect version parameter", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockNpmClient.fetchPackage).mockResolvedValue(createPackageMetadata());

      await repository.findByName("lodash", "4.17.21");

      expect(mockNpmClient.fetchPackage).toHaveBeenCalledWith("lodash", "4.17.21");
      expect(mockCache.set).toHaveBeenCalledWith(
        "pkg:lodash:4.17.21",
        expect.anything(),
        expect.anything(),
      );
    });

    it("should propagate errors from npm client", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockNpmClient.fetchPackage).mockRejectedValue(new Error("Not found"));

      await expect(repository.findByName("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("search", () => {
    it("should return empty array for empty query", async () => {
      const result = await repository.search("");

      expect(result).toEqual([]);
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockNpmClient.searchPackages).not.toHaveBeenCalled();
    });

    it("should return empty array for query shorter than 2 chars", async () => {
      const result = await repository.search("a");

      expect(result).toEqual([]);
      expect(mockNpmClient.searchPackages).not.toHaveBeenCalled();
    });

    it("should return cached search results if available", async () => {
      const cachedResults = [createSearchResult("lodash"), createSearchResult("lodash-es")];
      vi.mocked(mockCache.get).mockResolvedValue(cachedResults);

      const result = await repository.search("lodash");

      expect(result).toEqual(cachedResults);
      expect(mockNpmClient.searchPackages).not.toHaveBeenCalled();
    });

    it("should fetch from npm client when not cached", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const searchResults = [createSearchResult("lodash")];
      vi.mocked(mockNpmClient.searchPackages).mockResolvedValue(searchResults);

      const result = await repository.search("lodash");

      expect(result).toEqual(searchResults);
      expect(mockNpmClient.searchPackages).toHaveBeenCalledWith("lodash", 10);
    });

    it("should cache search results", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      const searchResults = [createSearchResult("lodash")];
      vi.mocked(mockNpmClient.searchPackages).mockResolvedValue(searchResults);

      await repository.search("lodash");

      expect(mockCache.set).toHaveBeenCalledWith(
        "search:lodash",
        searchResults,
        300, // SEARCH TTL
      );
    });

    it("should respect limit parameter", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockNpmClient.searchPackages).mockResolvedValue([]);

      await repository.search("lodash", 25);

      expect(mockNpmClient.searchPackages).toHaveBeenCalledWith("lodash", 25);
    });

    it("should propagate errors from npm client", async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockNpmClient.searchPackages).mockRejectedValue(new Error("API error"));

      await expect(repository.search("lodash")).rejects.toThrow("API error");
    });
  });
});
