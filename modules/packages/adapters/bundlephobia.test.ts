import { describe, it, expect, vi, beforeEach } from "vitest";
import { BundlephobiaClient } from "./bundlephobia";

describe("BundlephobiaClient", () => {
  let client: BundlephobiaClient;

  beforeEach(() => {
    client = new BundlephobiaClient();
    vi.clearAllMocks();
  });

  const mockOk = (body: unknown) =>
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => body,
    } as Response);

  describe("fetchBundleSize", () => {
    it("maps the bundlephobia response onto BundleSize", async () => {
      mockOk({
        size: 71642,
        gzip: 24452,
        dependencyCount: 0,
        hasJSModule: "lib/index.mjs",
        hasSideEffects: true,
        isModuleType: false,
      });

      const result = await client.fetchBundleSize("lodash", "4.17.21");

      expect(result).toEqual({
        minified: 71642,
        gzipped: 24452,
        dependencyCount: 0,
        hasJSModule: true,
        hasSideEffects: true,
        isModuleType: false,
      });
    });

    it("encodes the package name and includes the version", async () => {
      mockOk({ size: 100, gzip: 50 });

      await client.fetchBundleSize("@scope/pkg", "1.2.3");

      const call = vi.mocked(global.fetch).mock.calls[0]!;
      expect(call[0]).toContain(encodeURIComponent("@scope/pkg@1.2.3"));
    });

    it("omits the version when 'latest' or undefined is passed", async () => {
      mockOk({ size: 100, gzip: 50 });
      await client.fetchBundleSize("react");
      const call = vi.mocked(global.fetch).mock.calls[0]!;
      expect(call[0]).toContain("package=react");
      expect(call[0]).not.toContain("%40");

      mockOk({ size: 100, gzip: 50 });
      await client.fetchBundleSize("react", "latest");
      const call2 = vi.mocked(global.fetch).mock.calls[1]!;
      expect(call2[0]).toContain("package=react");
    });

    it("marks hasJSModule false when bundlephobia returns false (no ESM build)", async () => {
      mockOk({
        size: 1000,
        gzip: 400,
        hasJSModule: false,
        hasSideEffects: false,
      });

      const result = await client.fetchBundleSize("legacy");
      expect(result?.hasJSModule).toBe(false);
    });

    it("returns null when the response is missing size or gzip", async () => {
      mockOk({ hasSideEffects: true });
      expect(await client.fetchBundleSize("incomplete")).toBeNull();
    });

    it("returns null on HTTP error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);
      expect(await client.fetchBundleSize("unknown")).toBeNull();
    });

    it("returns null on network error", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("offline"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await client.fetchBundleSize("anything")).toBeNull();

      consoleSpy.mockRestore();
    });

    it("sends the X-Bundlephobia-User-Agent header", async () => {
      mockOk({ size: 1, gzip: 1 });
      await client.fetchBundleSize("test");
      const call = vi.mocked(global.fetch).mock.calls[0]!;
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers["X-Bundlephobia-User-Agent"]).toContain("ghostdeps");
    });
  });

  describe("fetchBundleSizesBatch", () => {
    it("returns an empty map for empty input", async () => {
      const result = await client.fetchBundleSizesBatch([]);
      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("fetches each package in parallel and maps name → BundleSize", async () => {
      mockOk({ size: 100, gzip: 50 });
      mockOk({ size: 200, gzip: 80 });
      mockOk({ size: 500, gzip: 200, hasJSModule: "esm.js", hasSideEffects: false });

      const result = await client.fetchBundleSizesBatch([
        { name: "a", version: "1.0.0" },
        { name: "b" },
        { name: "c", version: "2.0.0" },
      ]);

      expect(result.size).toBe(3);
      expect(result.get("a")?.gzipped).toBe(50);
      expect(result.get("b")?.gzipped).toBe(80);
      expect(result.get("c")?.hasJSModule).toBe(true);
      expect(result.get("c")?.hasSideEffects).toBe(false);
    });

    it("returns null entries for packages that 404 (without crashing the batch)", async () => {
      mockOk({ size: 100, gzip: 50 });
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await client.fetchBundleSizesBatch([
        { name: "ok" },
        { name: "missing" },
      ]);

      expect(result.get("ok")?.gzipped).toBe(50);
      expect(result.get("missing")).toBeNull();
    });
  });
});
