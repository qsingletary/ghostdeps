import { describe, it, expect, vi, beforeEach } from "vitest";
import { OsvClient } from "./osv-client";

describe("OsvClient", () => {
  let client: OsvClient;

  beforeEach(() => {
    client = new OsvClient();
    vi.clearAllMocks();
  });

  const mockQueryResponse = (vulns: unknown[]) =>
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ vulns }),
    } as Response);

  describe("fetchVulnerabilities", () => {
    it("maps a GHSA vuln with database_specific severity and patched version", async () => {
      mockQueryResponse([
        {
          id: "GHSA-29mw-wpgm-hmr9",
          aliases: ["CVE-2020-28500"],
          summary: "ReDoS in lodash",
          details: "Long description",
          severity: [
            {
              type: "CVSS_V3",
              score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L",
            },
          ],
          affected: [
            {
              package: { name: "lodash", ecosystem: "npm" },
              ranges: [
                {
                  type: "SEMVER",
                  events: [{ introduced: "0" }, { fixed: "4.17.21" }],
                },
              ],
            },
          ],
          references: [
            { type: "ADVISORY", url: "https://github.com/advisories/GHSA-29mw" },
            { type: "WEB", url: "https://example.com" },
          ],
          database_specific: { severity: "MODERATE" },
          published: "2021-02-15T00:00:00Z",
          modified: "2021-03-01T00:00:00Z",
        },
      ]);

      const vulns = await client.fetchVulnerabilities("lodash", "4.17.20");

      expect(vulns).toHaveLength(1);
      const v = vulns[0]!;
      expect(v.id).toBe("GHSA-29mw-wpgm-hmr9");
      expect(v.aliases).toEqual(["CVE-2020-28500"]);
      expect(v.summary).toBe("ReDoS in lodash");
      expect(v.severity).toBe("moderate");
      expect(v.cvssScore).toBeCloseTo(5.3, 1);
      expect(v.cvssVector).toContain("CVSS:3.1");
      expect(v.patchedVersions).toEqual(["4.17.21"]);
      expect(v.affectedRanges).toEqual([{ introduced: "0", fixed: "4.17.21" }]);
      expect(v.references).toHaveLength(2);
      expect(v.published).toBe("2021-02-15T00:00:00Z");
    });

    it("falls back to CVSS-derived severity when database_specific is missing", async () => {
      mockQueryResponse([
        {
          id: "CVE-2021-99999",
          severity: [
            {
              type: "CVSS_V3",
              score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            },
          ],
          affected: [
            {
              package: { name: "evil", ecosystem: "npm" },
              ranges: [
                { type: "SEMVER", events: [{ introduced: "0" }, { fixed: "2.0.0" }] },
              ],
            },
          ],
        },
      ]);

      const vulns = await client.fetchVulnerabilities("evil");
      expect(vulns[0]!.severity).toBe("critical");
      expect(vulns[0]!.cvssScore).toBeCloseTo(9.8, 1);
    });

    it("defaults to 'moderate' when neither database_specific nor CVSS is parseable", async () => {
      mockQueryResponse([
        { id: "GHSA-noop", affected: [{ package: { name: "x", ecosystem: "npm" } }] },
      ]);

      const vulns = await client.fetchVulnerabilities("x");
      expect(vulns[0]!.severity).toBe("moderate");
    });

    it("only collects affected ranges for the queried package (filters by name + ecosystem)", async () => {
      mockQueryResponse([
        {
          id: "GHSA-multi",
          affected: [
            {
              package: { name: "other", ecosystem: "npm" },
              ranges: [{ events: [{ fixed: "9.9.9" }] }],
            },
            {
              package: { name: "lodash", ecosystem: "npm" },
              ranges: [
                { events: [{ introduced: "0" }, { fixed: "4.17.21" }] },
              ],
            },
            {
              package: { name: "lodash", ecosystem: "PyPI" },
              ranges: [{ events: [{ fixed: "1.0.0" }] }],
            },
          ],
        },
      ]);

      const vulns = await client.fetchVulnerabilities("lodash");
      expect(vulns[0]!.patchedVersions).toEqual(["4.17.21"]);
    });

    it("matches package names case-insensitively", async () => {
      mockQueryResponse([
        {
          id: "GHSA-case",
          affected: [
            {
              package: { name: "LoDash", ecosystem: "npm" },
              ranges: [{ events: [{ introduced: "0" }, { fixed: "1.0.0" }] }],
            },
          ],
        },
      ]);

      const vulns = await client.fetchVulnerabilities("lodash");
      expect(vulns[0]!.patchedVersions).toEqual(["1.0.0"]);
    });

    it("returns an empty array on HTTP error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 502,
      } as Response);

      expect(await client.fetchVulnerabilities("anything")).toEqual([]);
    });

    it("returns an empty array on network error", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("offline"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await client.fetchVulnerabilities("anything")).toEqual([]);

      consoleSpy.mockRestore();
    });

    it("returns an empty array when no vulns are found", async () => {
      mockQueryResponse([]);
      expect(await client.fetchVulnerabilities("safe-package")).toEqual([]);
    });

    it("omits the version field when version is 'latest' or missing", async () => {
      mockQueryResponse([]);
      await client.fetchVulnerabilities("test", "latest");

      const call = vi.mocked(global.fetch).mock.calls[0]!;
      const body = JSON.parse(call[1]!.body as string);
      expect(body).toEqual({ package: { name: "test", ecosystem: "npm" } });
    });

    it("includes the version field when a concrete version is provided", async () => {
      mockQueryResponse([]);
      await client.fetchVulnerabilities("test", "1.2.3");

      const call = vi.mocked(global.fetch).mock.calls[0]!;
      const body = JSON.parse(call[1]!.body as string);
      expect(body).toEqual({
        package: { name: "test", ecosystem: "npm" },
        version: "1.2.3",
      });
    });
  });

  describe("fetchVulnerabilitiesBatch", () => {
    it("returns an empty map for empty input without making requests", async () => {
      const result = await client.fetchVulnerabilitiesBatch([]);
      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("queries batch, fetches per-id details, and maps back to packages", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              { vulns: [{ id: "GHSA-aaa" }] },
              {},
              { vulns: [{ id: "GHSA-aaa" }, { id: "GHSA-bbb" }] },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "GHSA-aaa",
            affected: [
              {
                package: { name: "lodash", ecosystem: "npm" },
                ranges: [{ events: [{ fixed: "4.17.21" }] }],
              },
              {
                package: { name: "express", ecosystem: "npm" },
                ranges: [{ events: [{ fixed: "5.0.0" }] }],
              },
            ],
            database_specific: { severity: "HIGH" },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "GHSA-bbb",
            affected: [
              {
                package: { name: "express", ecosystem: "npm" },
                ranges: [{ events: [{ fixed: "5.1.0" }] }],
              },
            ],
            database_specific: { severity: "CRITICAL" },
          }),
        } as Response);

      const result = await client.fetchVulnerabilitiesBatch([
        { name: "lodash", version: "4.17.20" },
        { name: "react", version: "19.0.0" },
        { name: "express", version: "4.18.0" },
      ]);

      expect(result.size).toBe(3);
      expect(result.get("lodash")).toHaveLength(1);
      expect(result.get("lodash")![0]!.id).toBe("GHSA-aaa");
      expect(result.get("react")).toEqual([]);
      expect(result.get("express")).toHaveLength(2);
      expect(result.get("express")!.map((v) => v.id).sort()).toEqual([
        "GHSA-aaa",
        "GHSA-bbb",
      ]);

      // Verify the batch request structure
      const batchCall = vi.mocked(global.fetch).mock.calls[0]!;
      expect(batchCall[0]).toBe("https://api.osv.dev/v1/querybatch");
      const batchBody = JSON.parse(batchCall[1]!.body as string);
      expect(batchBody.queries).toHaveLength(3);
      expect(batchBody.queries[0]).toEqual({
        package: { name: "lodash", ecosystem: "npm" },
        version: "4.17.20",
      });
    });

    it("returns all-empty results when the batch call fails", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await client.fetchVulnerabilitiesBatch([
        { name: "a" },
        { name: "b" },
      ]);

      expect(result.size).toBe(2);
      expect(result.get("a")).toEqual([]);
      expect(result.get("b")).toEqual([]);
    });

    it("skips detail fetches when no package has any vulns", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{}, {}] }),
      } as Response);

      const result = await client.fetchVulnerabilitiesBatch([
        { name: "a" },
        { name: "b" },
      ]);

      expect(result.get("a")).toEqual([]);
      expect(result.get("b")).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
