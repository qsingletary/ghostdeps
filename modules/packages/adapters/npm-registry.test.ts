import { describe, it, expect, vi, beforeEach } from "vitest";
import { NpmRegistryClient } from "./npm-registry";
import { PackageNotFoundError, ExternalApiError } from "../errors";

describe("NpmRegistryClient", () => {
  let client: NpmRegistryClient;

  beforeEach(() => {
    client = new NpmRegistryClient();
    vi.clearAllMocks();
  });

  describe("fetchPackage", () => {
    it("should fetch package metadata successfully", async () => {
      const mockResponse = {
        "dist-tags": { latest: "4.17.21" },
        versions: {
          "4.17.21": {
            name: "lodash",
            version: "4.17.21",
            description: "Lodash modular utilities",
            dependencies: {},
          },
        },
        time: { created: "2020-01-01", modified: "2024-01-01" },
        maintainers: [{ name: "jdalton" }],
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchPackage("lodash", "latest");

      expect(result.name).toBe("lodash");
      expect(result.version).toBe("4.17.21");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/lodash",
        expect.objectContaining({ headers: { Accept: "application/json" } }),
      );
    });

    it("should resolve version tags correctly", async () => {
      const mockResponse = {
        "dist-tags": { latest: "1.0.0", next: "2.0.0-beta.1" },
        versions: {
          "1.0.0": { name: "test", version: "1.0.0", dependencies: {} },
          "2.0.0-beta.1": { name: "test", version: "2.0.0-beta.1", dependencies: {} },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchPackage("test", "next");

      expect(result.version).toBe("2.0.0-beta.1");
    });

    it("should handle scoped packages correctly", async () => {
      const mockResponse = {
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": { name: "@org/package", version: "1.0.0", dependencies: {} },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await client.fetchPackage("@org/package", "latest");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/@org%2Fpackage",
        expect.anything(),
      );
    });

    it("should throw PackageNotFoundError for 404", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(client.fetchPackage("nonexistent", "latest")).rejects.toThrow(
        PackageNotFoundError,
      );
    });

    it("should throw ExternalApiError for other HTTP errors", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(client.fetchPackage("test", "latest")).rejects.toThrow(ExternalApiError);
    });

    it("should throw PackageNotFoundError for missing version", async () => {
      const mockResponse = {
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": { name: "test", version: "1.0.0", dependencies: {} },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await expect(client.fetchPackage("test", "2.0.0")).rejects.toThrow(
        PackageNotFoundError,
      );
    });

    it("should extract dependencies correctly", async () => {
      const mockResponse = {
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": {
            name: "test",
            version: "1.0.0",
            dependencies: { lodash: "^4.0.0" },
            devDependencies: { jest: "^29.0.0" },
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchPackage("test", "latest");

      expect(result.dependencies).toEqual({ lodash: "^4.0.0" });
      expect(result.devDependencies).toEqual({ jest: "^29.0.0" });
    });

    it("should handle packages with no dependencies", async () => {
      const mockResponse = {
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": {
            name: "test",
            version: "1.0.0",
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchPackage("test", "latest");

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({});
    });
  });

  describe("searchPackages", () => {
    it("should return empty array for short queries", async () => {
      const result = await client.searchPackages("a");

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should return empty array for empty queries", async () => {
      const result = await client.searchPackages("");

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should search packages successfully", async () => {
      const mockResponse = {
        objects: [
          {
            package: { name: "lodash", version: "4.17.21", description: "Utilities" },
            score: { final: 0.95 },
          },
          {
            package: { name: "lodash-es", version: "4.17.21", description: "ES module" },
            score: { final: 0.85 },
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const results = await client.searchPackages("lodash");

      expect(results).toHaveLength(2);
      expect(results[0]!.name).toBe("lodash");
      expect(results[0]!.score).toBe(0.95);
    });

    it("should respect limit parameter", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ objects: [] }),
      } as Response);

      await client.searchPackages("react", 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("size=5"),
        expect.anything(),
      );
    });

    it("should encode query parameter", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ objects: [] }),
      } as Response);

      await client.searchPackages("@org/package");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent("@org/package")),
        expect.anything(),
      );
    });

    it("should throw ExternalApiError on HTTP errors", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      await expect(client.searchPackages("test")).rejects.toThrow(ExternalApiError);
    });

    it("should handle packages without descriptions", async () => {
      const mockResponse = {
        objects: [
          {
            package: { name: "test", version: "1.0.0" },
            score: { final: 0.5 },
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const results = await client.searchPackages("test");

      expect(results[0]!.description).toBe("");
    });
  });
});
