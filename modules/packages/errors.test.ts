import { describe, it, expect } from "vitest";
import {
  PackageError,
  PackageNotFoundError,
  ResolutionError,
  ExternalApiError,
} from "./errors";

describe("PackageError", () => {
  it("should create error with message, code, and status", () => {
    const error = new PackageError("Test error", "TEST_ERROR", 400);

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe("PackageError");
  });

  it("should default to status 500", () => {
    const error = new PackageError("Test error", "TEST_ERROR");

    expect(error.statusCode).toBe(500);
  });

  it("should be instanceof Error", () => {
    const error = new PackageError("Test", "TEST");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PackageError);
  });
});

describe("PackageNotFoundError", () => {
  it("should create error for package name only", () => {
    const error = new PackageNotFoundError("lodash");

    expect(error.message).toBe("Package not found: lodash");
    expect(error.code).toBe("PACKAGE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("PackageNotFoundError");
  });

  it("should create error with package name and version", () => {
    const error = new PackageNotFoundError("lodash", "999.0.0");

    expect(error.message).toBe("Package not found: lodash@999.0.0");
  });

  it("should be instanceof PackageError", () => {
    const error = new PackageNotFoundError("test");

    expect(error).toBeInstanceOf(PackageError);
    expect(error).toBeInstanceOf(PackageNotFoundError);
  });
});

describe("ResolutionError", () => {
  it("should create error with package name and reason", () => {
    const error = new ResolutionError("lodash", "circular dependency detected");

    expect(error.message).toBe("Failed to resolve lodash: circular dependency detected");
    expect(error.code).toBe("RESOLUTION_FAILED");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("ResolutionError");
  });

  it("should be instanceof PackageError", () => {
    const error = new ResolutionError("test", "reason");

    expect(error).toBeInstanceOf(PackageError);
    expect(error).toBeInstanceOf(ResolutionError);
  });
});

describe("ExternalApiError", () => {
  it("should create error with API name and status", () => {
    const error = new ExternalApiError("npm registry", 503);

    expect(error.message).toBe("npm registry returned 503");
    expect(error.code).toBe("EXTERNAL_API_ERROR");
    expect(error.statusCode).toBe(502);
    expect(error.name).toBe("ExternalApiError");
  });

  it("should always return 502 status", () => {
    const error = new ExternalApiError("test api", 500);

    expect(error.statusCode).toBe(502);
  });

  it("should be instanceof PackageError", () => {
    const error = new ExternalApiError("test", 500);

    expect(error).toBeInstanceOf(PackageError);
    expect(error).toBeInstanceOf(ExternalApiError);
  });
});
