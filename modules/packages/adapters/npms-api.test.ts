import { describe, it, expect, vi, beforeEach } from "vitest";
import { NpmsApiClient } from "./npms-api";

describe("NpmsApiClient", () => {
  let client: NpmsApiClient;

  beforeEach(() => {
    client = new NpmsApiClient();
    vi.clearAllMocks();
  });

  describe("fetchScore", () => {
    it("should fetch and map score data correctly", async () => {
      const mockResponse = {
        score: { final: 0.85, detail: { quality: 0.9, popularity: 0.8, maintenance: 0.85 } },
        collected: {
          npm: {
            downloads: [
              { from: new Date().toISOString(), to: new Date().toISOString(), count: 10000 },
            ],
          },
          github: { issues: { openCount: 10, count: 100 } },
          source: {
            vulnerabilities: [{ id: "1", severity: "high", title: "Test vuln" }],
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchScore("test-package");

      expect(result.score).toBe(0.85);
      expect(result.quality).toBe(0.9);
      expect(result.popularity).toBe(0.8);
      expect(result.maintenance).toBe(0.85);
      expect(result.github?.issues.openCount).toBe(10);
      expect(result.github?.issues.totalCount).toBe(100);
      expect(result.vulnerabilities).toHaveLength(1);
    });

    it("should return empty data on HTTP errors", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await client.fetchScore("nonexistent");

      expect(result.score).toBe(0);
      expect(result.downloads.weekly).toBe(0);
      expect(result.vulnerabilities).toEqual([]);
    });

    it("should return empty data on fetch errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const result = await client.fetchScore("test");

      expect(result.score).toBe(0);
      expect(result.downloads.weekly).toBe(0);
    });

    it("should encode scoped package names", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ score: { final: 0.5 } }),
      } as Response);

      await client.fetchScore("@org/package");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent("@org/package")),
        expect.anything(),
      );
    });

    it("should handle missing github data", async () => {
      const mockResponse = {
        score: { final: 0.5 },
        collected: {
          npm: { downloads: [] },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchScore("no-github");

      expect(result.github).toBeUndefined();
    });

    it("should sum weekly downloads correctly", async () => {
      const now = new Date();
      const recent = new Date(now);
      recent.setDate(recent.getDate() - 3);
      const old = new Date(now);
      old.setDate(old.getDate() - 10);

      const mockResponse = {
        score: { final: 0.5 },
        collected: {
          npm: {
            downloads: [
              { from: recent.toISOString(), to: now.toISOString(), count: 5000 },
              { from: old.toISOString(), to: recent.toISOString(), count: 3000 },
            ],
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchScore("test");

      // Only the recent download should count (within 7 days)
      expect(result.downloads.weekly).toBe(5000);
    });
  });

  describe("fetchScoresBatch", () => {
    it("should return empty map for empty input", async () => {
      const result = await client.fetchScoresBatch([]);

      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should fetch batch scores successfully", async () => {
      const mockResponse = {
        lodash: {
          score: { final: 0.9, detail: { quality: 0.9, popularity: 0.9, maintenance: 0.9 } },
          collected: { npm: { downloads: [] } },
        },
        react: {
          score: { final: 0.95, detail: { quality: 0.95, popularity: 0.95, maintenance: 0.95 } },
          collected: { npm: { downloads: [] } },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchScoresBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(result.get("lodash")?.score).toBe(0.9);
      expect(result.get("react")?.score).toBe(0.95);
    });

    it("should use POST request with correct body", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await client.fetchScoresBatch(["lodash", "react"]);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.npms.io/v2/package/mget",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(["lodash", "react"]),
        }),
      );
    });

    it("should handle missing packages in batch response", async () => {
      const mockResponse = {
        lodash: {
          score: { final: 0.9 },
          collected: { npm: { downloads: [] } },
        },
        // react is missing
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.fetchScoresBatch(["lodash", "react"]);

      expect(result.get("lodash")?.score).toBe(0.9);
      expect(result.get("react")?.score).toBe(0); // empty data
    });

    it("should fill with empty data on batch failure", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await client.fetchScoresBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(result.get("lodash")?.score).toBe(0);
      expect(result.get("react")?.score).toBe(0);
    });

    it("should handle fetch errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const result = await client.fetchScoresBatch(["lodash", "react"]);

      expect(result.size).toBe(2);
      expect(result.get("lodash")?.score).toBe(0);
      expect(result.get("react")?.score).toBe(0);
    });
  });
});
