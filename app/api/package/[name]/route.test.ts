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
      getPackageRepository: vi.fn(),
    },
  };
});

describe("GET /api/package/[name]", () => {
  const mockFindByName = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.getPackageRepository).mockReturnValue({
      findByName: mockFindByName,
      search: vi.fn(),
    });
  });

  const createRequest = (version?: string): NextRequest => {
    const params = new URLSearchParams();
    if (version) params.set("version", version);
    const url = params.toString()
      ? `http://localhost/api/package/lodash?${params.toString()}`
      : "http://localhost/api/package/lodash";
    return new NextRequest(url);
  };

  const createParams = (name: string) => ({
    params: Promise.resolve({ name }),
  });

  it("should return package metadata", async () => {
    const metadata = {
      name: "lodash",
      version: "4.17.21",
      dependencies: {},
    };
    mockFindByName.mockResolvedValue(metadata);

    const response = await GET(createRequest(), createParams("lodash"));
    const data = await response.json();

    expect(data).toEqual(metadata);
    expect(mockFindByName).toHaveBeenCalledWith("lodash", "latest");
  });

  it("should respect version parameter", async () => {
    mockFindByName.mockResolvedValue({ name: "lodash", version: "4.0.0" });

    await GET(createRequest("4.0.0"), createParams("lodash"));

    expect(mockFindByName).toHaveBeenCalledWith("lodash", "4.0.0");
  });

  it("should decode URL-encoded package names", async () => {
    mockFindByName.mockResolvedValue({ name: "@org/package", version: "1.0.0" });

    await GET(createRequest(), createParams("%40org%2Fpackage"));

    expect(mockFindByName).toHaveBeenCalledWith("@org/package", "latest");
  });

  it("should handle PackageNotFoundError", async () => {
    mockFindByName.mockRejectedValue(new PackageNotFoundError("nonexistent", "1.0.0"));

    const response = await GET(createRequest(), createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PACKAGE_NOT_FOUND");
  });

  it("should handle PackageError", async () => {
    mockFindByName.mockRejectedValue(new PackageError("API error", "API_ERROR", 502));

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.code).toBe("API_ERROR");
  });

  it("should handle unexpected errors", async () => {
    mockFindByName.mockRejectedValue(new Error("Unexpected"));

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
