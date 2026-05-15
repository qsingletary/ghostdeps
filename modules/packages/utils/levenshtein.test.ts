import { describe, it, expect } from "vitest";
import { levenshtein } from "./levenshtein";

describe("levenshtein", () => {
  it.each([
    ["kitten", "sitting", 3],
    ["flaw", "lawn", 2],
    ["abc", "abc", 0],
    ["", "abc", 3],
    ["abc", "", 3],
    ["a", "b", 1],
    ["react", "raect", 2], // transpositions count as 2 substitutions
    ["lodash", "lodahs", 2],
  ])("levenshtein('%s', '%s') === %d", (a, b, expected) => {
    expect(levenshtein(a, b)).toBe(expected);
  });

  it("returns maxDistance+1 early when length difference exceeds maxDistance", () => {
    expect(levenshtein("a", "abcdef", 2)).toBe(3);
  });

  it("returns maxDistance+1 early when the per-row minimum exceeds it", () => {
    // 'abc' vs 'xyz' has distance 3. With max=2 we should bail.
    expect(levenshtein("abc", "xyz", 2)).toBeGreaterThan(2);
  });

  it("still returns the exact distance when it is at or below maxDistance", () => {
    expect(levenshtein("react", "ract", 2)).toBe(1);
    expect(levenshtein("lodash", "lodahs", 2)).toBe(2);
  });
});
