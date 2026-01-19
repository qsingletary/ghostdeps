import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { container, PackageError } from "@/modules/packages";

vi.mock("@/modules/packages", async () => {
  const actual = await vi.importActual("@/modules/packages");
  return {
    ...actual,
    container: {
      getPackageRepository: vi.fn(),
    },
  };
});

describe("GET /api/search", () => {
  const mockSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.getPackageRepository).mockReturnValue({
      findByName: vi.fn(),
      search: mockSearch,
    });
  });

  const createRequest = (query: string, limit?: number): NextRequest => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (limit !== undefined) params.set("limit", String(limit));
    return new NextRequest(`http://localhost/api/search?${params.toString()}`);
  };

  it("should return empty results for short queries", async () => {
    const response = await GET(createRequest("a"));
    const data = await response.json();

    expect(data.results).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("should return empty results for empty queries", async () => {
    const response = await GET(createRequest(""));
    const data = await response.json();

    expect(data.results).toEqual([]);
  });

  it("should search packages with valid query", async () => {
    const searchResults = [
      { name: "lodash", version: "4.17.21", description: "Utilities", score: 0.95 },
    ];
    mockSearch.mockResolvedValue(searchResults);

    const response = await GET(createRequest("lodash"));
    const data = await response.json();

    expect(data.results).toEqual(searchResults);
    expect(mockSearch).toHaveBeenCalledWith("lodash", 10);
  });

  it("should respect limit parameter", async () => {
    mockSearch.mockResolvedValue([]);

    await GET(createRequest("test", 5));

    expect(mockSearch).toHaveBeenCalledWith("test", 5);
  });

  it("should clamp limit to valid range (1-25)", async () => {
    mockSearch.mockResolvedValue([]);

    await GET(createRequest("test", 100));
    expect(mockSearch).toHaveBeenCalledWith("test", 25);

    await GET(createRequest("test", 0));
    expect(mockSearch).toHaveBeenCalledWith("test", 1);
  });

  it("should default to limit 10 for invalid values", async () => {
    mockSearch.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/search?q=test&limit=invalid");
    await GET(request);

    expect(mockSearch).toHaveBeenCalledWith("test", 10);
  });

  it("should handle PackageError", async () => {
    mockSearch.mockRejectedValue(new PackageError("Search failed", "SEARCH_ERROR", 503));

    const response = await GET(createRequest("test"));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("Search failed");
    expect(data.code).toBe("SEARCH_ERROR");
  });

  it("should handle unexpected errors", async () => {
    mockSearch.mockRejectedValue(new Error("Unexpected"));

    const response = await GET(createRequest("test"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Search failed");
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
