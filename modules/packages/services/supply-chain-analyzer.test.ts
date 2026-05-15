import { describe, it, expect } from "vitest";
import { SupplyChainAnalyzer } from "./supply-chain-analyzer";
import type { NpmPackageMetadata } from "../types";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const metadata = (
  overrides: Partial<NpmPackageMetadata> = {},
): NpmPackageMetadata => ({
  name: "test-pkg",
  version: "1.0.0",
  dependencies: {},
  time: { created: daysAgo(365), modified: daysAgo(30) },
  maintainers: [
    { name: "alice" },
    { name: "bob" },
  ],
  ...overrides,
});

describe("SupplyChainAnalyzer", () => {
  describe("new-popularity", () => {
    it("flags packages <7 days old with >1000 weekly downloads", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "totally-new",
        metadata: metadata({ time: { created: daysAgo(3), modified: daysAgo(1) } }),
        weeklyDownloads: 5000,
      });

      const warning = warnings.find((w) => w.kind === "new-popularity");
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe("moderate");
      expect(warning!.details).toMatchObject({
        createdDaysAgo: 3,
        weeklyDownloads: 5000,
      });
    });

    it("does not flag old packages with high downloads", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "old-popular",
        metadata: metadata({ time: { created: daysAgo(400), modified: daysAgo(30) } }),
        weeklyDownloads: 999_999,
      });

      expect(warnings.find((w) => w.kind === "new-popularity")).toBeUndefined();
    });

    it("does not flag new packages without traction", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "brand-new-obscure",
        metadata: metadata({ time: { created: daysAgo(2), modified: daysAgo(1) } }),
        weeklyDownloads: 5,
      });

      expect(warnings.find((w) => w.kind === "new-popularity")).toBeUndefined();
    });
  });

  describe("single-maintainer-new", () => {
    it("flags solo-author packages younger than 30 days", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "lone-wolf",
        metadata: metadata({
          time: { created: daysAgo(10), modified: daysAgo(1) },
          maintainers: [{ name: "solo" }],
        }),
        weeklyDownloads: 5,
      });

      const w = warnings.find((x) => x.kind === "single-maintainer-new");
      expect(w).toBeDefined();
      expect(w!.severity).toBe("low");
    });

    it("does not flag solo-author packages older than 30 days", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "lone-veteran",
        metadata: metadata({
          time: { created: daysAgo(120), modified: daysAgo(30) },
          maintainers: [{ name: "solo" }],
        }),
        weeklyDownloads: 5,
      });

      expect(
        warnings.find((w) => w.kind === "single-maintainer-new"),
      ).toBeUndefined();
    });

    it("does not flag multi-maintainer new packages", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "new-team",
        metadata: metadata({
          time: { created: daysAgo(5), modified: daysAgo(1) },
        }),
        weeklyDownloads: 5,
      });

      expect(
        warnings.find((w) => w.kind === "single-maintainer-new"),
      ).toBeUndefined();
    });

    it("does not flag packages with no time data", () => {
      const analyzer = new SupplyChainAnalyzer();
      const warnings = analyzer.analyze({
        name: "no-time",
        metadata: metadata({
          time: undefined,
          maintainers: [{ name: "solo" }],
        }),
        weeklyDownloads: 5,
      });

      expect(
        warnings.find((w) => w.kind === "single-maintainer-new"),
      ).toBeUndefined();
    });
  });

  describe("typosquat", () => {
    const analyzer = new SupplyChainAnalyzer(
      new Set(["react", "lodash", "express", "axios"]),
    );

    it("flags names within Levenshtein distance 2 of a popular package", () => {
      const warnings = analyzer.analyze({
        name: "lodahs",
        metadata: null,
        weeklyDownloads: 0,
      });

      const w = warnings.find((x) => x.kind === "typosquat");
      expect(w).toBeDefined();
      expect(w!.severity).toBe("high");
      expect(w!.details).toMatchObject({ similarTo: "lodash" });
    });

    it("does not flag the popular package itself", () => {
      const warnings = analyzer.analyze({
        name: "react",
        metadata: null,
        weeklyDownloads: 0,
      });
      expect(warnings.find((w) => w.kind === "typosquat")).toBeUndefined();
    });

    it("matches case-insensitively", () => {
      const warnings = analyzer.analyze({
        name: "ReAcT",
        metadata: null,
        weeklyDownloads: 0,
      });
      expect(warnings.find((w) => w.kind === "typosquat")).toBeUndefined();
    });

    it("does not flag names that are too far away", () => {
      const warnings = analyzer.analyze({
        name: "completely-unrelated-name",
        metadata: null,
        weeklyDownloads: 0,
      });
      expect(warnings.find((w) => w.kind === "typosquat")).toBeUndefined();
    });

    it("prefers the closest match when multiple candidates qualify", () => {
      const a = new SupplyChainAnalyzer(new Set(["react", "react-dom"]));
      const w = a
        .analyze({ name: "react-doms", metadata: null, weeklyDownloads: 0 })
        .find((x) => x.kind === "typosquat");
      expect(w?.details).toMatchObject({
        similarTo: "react-dom",
        distance: 1,
      });
    });
  });

  describe("default popular list", () => {
    it("includes well-known npm packages so the default analyzer catches typosquats", () => {
      const analyzer = new SupplyChainAnalyzer();

      const typosquat = analyzer
        .analyze({ name: "expres", metadata: null, weeklyDownloads: 0 })
        .find((w) => w.kind === "typosquat");

      expect(typosquat).toBeDefined();
      expect(typosquat?.details?.similarTo).toBe("express");
    });
  });

  it("returns an empty array when nothing is suspicious", () => {
    const analyzer = new SupplyChainAnalyzer(new Set(["react", "lodash"]));
    const warnings = analyzer.analyze({
      name: "perfectly-fine-package",
      metadata: metadata({
        time: { created: daysAgo(500), modified: daysAgo(30) },
      }),
      weeklyDownloads: 50_000,
    });

    expect(warnings).toEqual([]);
  });
});
