import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePackageSearch } from "./use-package-search";

describe("usePackageSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with empty values", () => {
    const { result } = renderHook(() => usePackageSearch());

    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should update query on setQuery", () => {
    const { result } = renderHook(() => usePackageSearch());

    act(() => {
      result.current.setQuery("lodash");
    });

    expect(result.current.query).toBe("lodash");
  });

  it("should not search for queries shorter than 2 characters", async () => {
    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("a");
    });

    // Wait for potential debounce
    await new Promise((r) => setTimeout(r, 50));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("should return search results after debounce", async () => {
    const mockResults = [
      { name: "lodash", version: "4.17.21", description: "Utilities", score: 0.95 },
    ];
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    } as Response);

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("lodash");
    });

    await waitFor(
      () => {
        expect(result.current.results).toEqual(mockResults);
      },
      { timeout: 1000 },
    );
  });

  it("should set isLoading while fetching", async () => {
    let resolvePromise: (value: Response) => void;
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("lodash");
    });

    // Wait for debounce and fetch start
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true);
      },
      { timeout: 1000 },
    );

    // Resolve the fetch
    act(() => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should clear results when query is cleared", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ name: "test", version: "1.0.0", description: "", score: 0.5 }],
        }),
    } as Response);

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("test");
    });

    await waitFor(
      () => {
        expect(result.current.results.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );

    act(() => {
      result.current.setQuery("");
    });

    // Short query clears results immediately
    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });

  it("should handle fetch errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("test");
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(result.current.results).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("should not log AbortError", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    vi.mocked(global.fetch).mockRejectedValue(abortError);

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("test");
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should encode query parameter in URL", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response);

    const { result } = renderHook(() => usePackageSearch(10));

    act(() => {
      result.current.setQuery("@org/package");
    });

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("@org/package")),
      expect.anything(),
    );
  });
});
