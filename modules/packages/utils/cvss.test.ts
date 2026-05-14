import { describe, it, expect } from "vitest";
import { parseCvssV3, severityFromGhsaString, severityFromScore } from "./cvss";

describe("severityFromScore", () => {
  it.each([
    [0, "low"],
    [3.9, "low"],
    [4.0, "moderate"],
    [6.9, "moderate"],
    [7.0, "high"],
    [8.9, "high"],
    [9.0, "critical"],
    [10.0, "critical"],
  ])("score %f → %s", (score, expected) => {
    expect(severityFromScore(score)).toBe(expected);
  });
});

describe("severityFromGhsaString", () => {
  it.each([
    ["CRITICAL", "critical"],
    ["HIGH", "high"],
    ["MODERATE", "moderate"],
    ["MEDIUM", "moderate"],
    ["LOW", "low"],
    ["critical", "critical"],
    ["medium", "moderate"],
  ])("%s → %s", (input, expected) => {
    expect(severityFromGhsaString(input)).toBe(expected);
  });

  it.each([
    [undefined, null],
    ["", null],
    ["NONE", null],
    ["INFORMATIONAL", null],
    ["bogus", null],
  ])("%s → null", (input, expected) => {
    expect(severityFromGhsaString(input as string | undefined)).toBe(expected);
  });
});

describe("parseCvssV3", () => {
  it("computes the canonical critical score (10.0) for full network/no-auth/all-impact-high", () => {
    const result = parseCvssV3("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
    expect(result).not.toBeNull();
    expect(result!.baseScore).toBeCloseTo(9.8, 1);
    expect(result!.severity).toBe("critical");
  });

  it("computes a known high score for AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H (NVD: 7.5)", () => {
    const result = parseCvssV3("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H");
    expect(result).not.toBeNull();
    expect(result!.baseScore).toBeCloseTo(7.5, 1);
    expect(result!.severity).toBe("high");
  });

  it("computes a moderate score for AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L (NVD: 5.3)", () => {
    const result = parseCvssV3("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L");
    expect(result).not.toBeNull();
    expect(result!.baseScore).toBeCloseTo(5.3, 1);
    expect(result!.severity).toBe("moderate");
  });

  it("returns 0 score when no impact metrics are set (C/I/A all None)", () => {
    const result = parseCvssV3("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N");
    expect(result).not.toBeNull();
    expect(result!.baseScore).toBe(0);
    expect(result!.severity).toBe("low");
  });

  it("handles scope-changed vectors", () => {
    const result = parseCvssV3("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H");
    expect(result).not.toBeNull();
    expect(result!.baseScore).toBeCloseTo(10.0, 1);
    expect(result!.severity).toBe("critical");
  });

  it("accepts CVSS:3.0 prefix", () => {
    const result = parseCvssV3("CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it.each([
    [""],
    ["not a vector"],
    ["CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P"], // wrong version
    ["CVSS:3.1/AV:N"], // missing required metrics
    ["CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"], // invalid metric value
  ])("returns null for malformed input: %s", (vector) => {
    expect(parseCvssV3(vector)).toBeNull();
  });
});
