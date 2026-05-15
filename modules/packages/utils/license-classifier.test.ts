import { describe, it, expect } from "vitest";
import {
  categoryLabel,
  categoryRank,
  classifyLicense,
} from "./license-classifier";

describe("classifyLicense", () => {
  describe("permissive", () => {
    it.each([
      "MIT",
      "ISC",
      "Apache-2.0",
      "BSD-3-Clause",
      "BSD-2-Clause",
      "0BSD",
      "Unlicense",
      "CC0-1.0",
      "WTFPL",
      "Zlib",
      "(MIT OR Apache-2.0)",
      "Apache-2.0 AND MIT",
      "BlueOak-1.0.0",
    ])("classifies '%s' as permissive", (license) => {
      expect(classifyLicense(license).category).toBe("permissive");
    });
  });

  describe("strong-copyleft", () => {
    it.each([
      "GPL-2.0",
      "GPL-3.0",
      "GPL-3.0-only",
      "GPL-3.0-or-later",
      "AGPL-3.0",
      "AGPL-3.0-or-later",
      "SSPL-1.0",
    ])("classifies '%s' as strong-copyleft", (license) => {
      expect(classifyLicense(license).category).toBe("strong-copyleft");
    });

    it("classifies an expression with GPL anywhere as strong-copyleft", () => {
      expect(classifyLicense("MIT OR GPL-3.0").category).toBe(
        "strong-copyleft",
      );
    });
  });

  describe("weak-copyleft", () => {
    it.each([
      "LGPL-2.1",
      "LGPL-3.0",
      "LGPL-3.0-or-later",
      "MPL-2.0",
      "EPL-2.0",
      "CDDL-1.0",
      "EUPL-1.2",
    ])("classifies '%s' as weak-copyleft", (license) => {
      expect(classifyLicense(license).category).toBe("weak-copyleft");
    });
  });

  describe("proprietary", () => {
    it.each([
      "UNLICENSED",
      "SEE LICENSE IN ./LICENSE",
      "Commercial",
      "Proprietary",
      "BSL-1.1",
      "BUSL-1.1",
    ])("classifies '%s' as proprietary", (license) => {
      expect(classifyLicense(license).category).toBe("proprietary");
    });
  });

  describe("unknown", () => {
    it.each([
      undefined,
      null,
      "",
      "   ",
      "UNKNOWN",
      "some-custom-license-that-no-one-uses",
    ])("classifies '%s' as unknown", (license) => {
      expect(classifyLicense(license).category).toBe("unknown");
    });
  });

  it("preserves the original SPDX string", () => {
    expect(classifyLicense("(MIT OR Apache-2.0)").spdx).toBe(
      "(MIT OR Apache-2.0)",
    );
  });

  it("trims whitespace from the input", () => {
    const result = classifyLicense("  MIT  ");
    expect(result.spdx).toBe("MIT");
    expect(result.category).toBe("permissive");
  });

  it("treats 'UNLICENSED' (no trailing E) as proprietary, not permissive", () => {
    expect(classifyLicense("UNLICENSED").category).toBe("proprietary");
  });

  it("treats 'Unlicense' (the SPDX id) as permissive", () => {
    expect(classifyLicense("Unlicense").category).toBe("permissive");
  });
});

describe("categoryLabel", () => {
  it("provides human-readable labels", () => {
    expect(categoryLabel("permissive")).toBe("Permissive");
    expect(categoryLabel("weak-copyleft")).toBe("Weak copyleft");
    expect(categoryLabel("strong-copyleft")).toBe("Strong copyleft");
    expect(categoryLabel("proprietary")).toBe("Proprietary");
    expect(categoryLabel("unknown")).toBe("Unknown");
  });
});

describe("categoryRank", () => {
  it("orders categories by compliance risk (higher = riskier)", () => {
    expect(categoryRank("proprietary")).toBeGreaterThan(
      categoryRank("strong-copyleft"),
    );
    expect(categoryRank("strong-copyleft")).toBeGreaterThan(
      categoryRank("unknown"),
    );
    expect(categoryRank("unknown")).toBeGreaterThan(
      categoryRank("weak-copyleft"),
    );
    expect(categoryRank("weak-copyleft")).toBeGreaterThan(
      categoryRank("permissive"),
    );
  });
});
