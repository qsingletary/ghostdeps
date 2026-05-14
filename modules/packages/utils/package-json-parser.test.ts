import { describe, it, expect } from "vitest";
import { parsePackageJson } from "./package-json-parser";

describe("parsePackageJson", () => {
  it("should parse a valid package.json with dependencies and devDependencies", () => {
    const content = JSON.stringify({
      name: "my-app",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.21", react: "^19.0.0" },
      devDependencies: { vitest: "^4.0.0" },
    });

    const result = parsePackageJson(content);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.name).toBe("my-app");
    expect(result.data.version).toBe("1.0.0");
    expect(result.data.dependencies).toEqual({
      lodash: "^4.17.21",
      react: "^19.0.0",
    });
    expect(result.data.devDependencies).toEqual({ vitest: "^4.0.0" });
    expect(result.data.allDependencies).toEqual(
      expect.arrayContaining(["lodash", "react", "vitest"]),
    );
    expect(result.data.allDependencies).toHaveLength(3);
  });

  it("should parse a package.json with only name and version", () => {
    const content = JSON.stringify({ name: "tiny", version: "0.0.1" });
    const result = parsePackageJson(content);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.dependencies).toEqual({});
    expect(result.data.devDependencies).toEqual({});
    expect(result.data.allDependencies).toEqual([]);
  });

  it("should dedupe packages that appear in both dependencies and devDependencies", () => {
    const content = JSON.stringify({
      dependencies: { lodash: "^4.17.21" },
      devDependencies: { lodash: "^4.17.21", vitest: "^4.0.0" },
    });

    const result = parsePackageJson(content);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.allDependencies).toHaveLength(2);
    expect(new Set(result.data.allDependencies)).toEqual(
      new Set(["lodash", "vitest"]),
    );
  });

  it("should ignore non-string values in dependencies", () => {
    const content = JSON.stringify({
      dependencies: { lodash: "^4.17.21", bad: 42, other: null },
    });

    const result = parsePackageJson(content);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.dependencies).toEqual({ lodash: "^4.17.21" });
  });

  it("should return INVALID_JSON for malformed JSON", () => {
    const result = parsePackageJson("{ not valid json");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INVALID_JSON");
  });

  it("should return INVALID_STRUCTURE for top-level array", () => {
    const result = parsePackageJson("[]");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INVALID_STRUCTURE");
  });

  it("should return INVALID_STRUCTURE for null", () => {
    const result = parsePackageJson("null");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INVALID_STRUCTURE");
  });

  it("should return INVALID_STRUCTURE for a primitive value", () => {
    const result = parsePackageJson('"just a string"');

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("INVALID_STRUCTURE");
  });

  it("should treat missing dependencies field as empty object", () => {
    const content = JSON.stringify({ name: "test" });
    const result = parsePackageJson(content);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.dependencies).toEqual({});
    expect(result.data.devDependencies).toEqual({});
  });

  it("should treat non-object dependencies field as empty", () => {
    const content = JSON.stringify({
      dependencies: ["lodash", "react"],
      devDependencies: "not-an-object",
    });

    const result = parsePackageJson(content);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.dependencies).toEqual({});
    expect(result.data.devDependencies).toEqual({});
  });

  it("should ignore non-string name and version", () => {
    const content = JSON.stringify({
      name: 42,
      version: true,
      dependencies: {},
    });

    const result = parsePackageJson(content);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBeUndefined();
    expect(result.data.version).toBeUndefined();
  });
});
