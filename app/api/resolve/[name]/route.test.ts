import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import {
  container,
  PackageError,
  PackageNotFoundError,
} from "@/modules/packages";

vi.mock("@/modules/packages", async () => {
  const actual = await vi.importActual("@/modules/packages");
  return {
    ...actual,
    container: {
      getDependencyResolver: vi.fn(),
    },
  };
});

describe("GET /api/resolve/[name]", () => {
  const mockResolve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.getDependencyResolver).mockReturnValue({
      resolve: mockResolve,
    });
  });

  const createRequest = (version?: string, maxDepth?: number): NextRequest => {
    const params = new URLSearchParams();
    if (version) params.set("version", version);
    if (maxDepth !== undefined) params.set("maxDepth", String(maxDepth));
    const url = params.toString()
      ? `http://localhost/api/resolve/lodash?${params.toString()}`
      : "http://localhost/api/resolve/lodash";
    return new NextRequest(url);
  };

  const createParams = (name: string) => ({
    params: Promise.resolve({ name }),
  });

  const createTree = () => ({
    root: {
      id: "lodash@4.17.21",
      name: "lodash",
      version: "4.17.21",
      health: { overall: 85, level: "healthy" },
      depth: 0,
      dependencies: [],
    },
    stats: {
      totalPackages: 1,
      uniquePackages: 1,
      maxDepth: 0,
      healthDistribution: { healthy: 1, warning: 0, critical: 0, unknown: 0 },
    },
    resolvedAt: "2024-01-01T00:00:00Z",
  });

  it("should return dependency tree", async () => {
    const tree = createTree();
    mockResolve.mockResolvedValue(tree);

    const response = await GET(createRequest(), createParams("lodash"));
    const data = await response.json();

    expect(data).toEqual(tree);
    expect(mockResolve).toHaveBeenCalledWith("lodash", "latest", 5);
  });

  it("should respect version parameter", async () => {
    mockResolve.mockResolvedValue(createTree());

    await GET(createRequest("4.0.0"), createParams("lodash"));

    expect(mockResolve).toHaveBeenCalledWith("lodash", "4.0.0", 5);
  });

  it("should respect maxDepth parameter", async () => {
    mockResolve.mockResolvedValue(createTree());

    await GET(createRequest(undefined, 3), createParams("lodash"));

    expect(mockResolve).toHaveBeenCalledWith("lodash", "latest", 3);
  });

  it("should clamp maxDepth to valid range (1-10)", async () => {
    mockResolve.mockResolvedValue(createTree());

    await GET(createRequest(undefined, 20), createParams("lodash"));
    expect(mockResolve).toHaveBeenCalledWith("lodash", "latest", 10);

    await GET(createRequest(undefined, 0), createParams("lodash"));
    expect(mockResolve).toHaveBeenCalledWith("lodash", "latest", 1);
  });

  it("should default maxDepth to 5 for invalid values", async () => {
    mockResolve.mockResolvedValue(createTree());

    const request = new NextRequest(
      "http://localhost/api/resolve/lodash?maxDepth=invalid",
    );
    await GET(request, createParams("lodash"));

    expect(mockResolve).toHaveBeenCalledWith("lodash", "latest", 5);
  });

  it("should decode URL-encoded package names", async () => {
    mockResolve.mockResolvedValue(createTree());

    await GET(createRequest(), createParams("%40org%2Fpackage"));

    expect(mockResolve).toHaveBeenCalledWith("@org/package", "latest", 5);
  });

  it("should handle PackageNotFoundError", async () => {
    mockResolve.mockRejectedValue(new PackageNotFoundError("nonexistent"));

    const response = await GET(createRequest(), createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PACKAGE_NOT_FOUND");
  });

  it("should handle PackageError", async () => {
    mockResolve.mockRejectedValue(
      new PackageError("Resolution failed", "RESOLUTION_ERROR", 500),
    );

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("RESOLUTION_ERROR");
  });

  it("should handle unexpected errors", async () => {
    mockResolve.mockRejectedValue(new Error("Unexpected"));

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
