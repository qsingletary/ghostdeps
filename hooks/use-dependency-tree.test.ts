import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDependencyTree } from "./use-dependency-tree";

describe("useDependencyTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockTree = () => ({
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

  it("should initialize with null values", () => {
    const { result } = renderHook(() => useDependencyTree());

    expect(result.current.tree).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should resolve a dependency tree", async () => {
    const mockTree = createMockTree();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTree),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("lodash");
    });

    expect(result.current.tree).toEqual(mockTree);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should set isLoading while resolving", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(global.fetch).mockReturnValue(promise as Promise<Response>);

    const { result } = renderHook(() => useDependencyTree());

    act(() => {
      result.current.resolve("lodash");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(createMockTree()),
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should pass version and maxDepth parameters", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockTree()),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("lodash", "4.17.21", 3);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/resolve/lodash?version=4.17.21&maxDepth=3"),
    );
  });

  it("should use default values for version and maxDepth", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockTree()),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("lodash");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/resolve/lodash?version=latest&maxDepth=5"),
    );
  });

  it("should handle API errors", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Package not found" }),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("nonexistent");
    });

    expect(result.current.tree).toBeNull();
    expect(result.current.error).toBe("Package not found");
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle network errors", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("test");
    });

    expect(result.current.tree).toBeNull();
    expect(result.current.error).toBe("Network error");
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle unknown errors", async () => {
    vi.mocked(global.fetch).mockRejectedValue("Something went wrong");

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("test");
    });

    expect(result.current.error).toBe("Something went wrong");
  });

  it("should clear tree and error on new resolve", async () => {
    const mockTree = createMockTree();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTree),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("lodash");
    });

    expect(result.current.tree).toEqual(mockTree);

    // Start a new resolve
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(global.fetch).mockReturnValue(promise as Promise<Response>);

    act(() => {
      result.current.resolve("react");
    });

    // Tree should be cleared while loading
    await waitFor(() => {
      expect(result.current.tree).toBeNull();
      expect(result.current.error).toBeNull();
    });

    // Complete the request
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(createMockTree()),
      });
    });
  });

  it("should encode package names in URL", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockTree()),
    } as Response);

    const { result } = renderHook(() => useDependencyTree());

    await act(async () => {
      await result.current.resolve("@org/package");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/resolve/%40org%2Fpackage"),
    );
  });

  it("should clear tree and error", async () => {
    const mockTree = createMockTree();
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTree),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Error" }),
      } as Response);

    const { result } = renderHook(() => useDependencyTree());

    // First resolve successfully
    await act(async () => {
      await result.current.resolve("lodash");
    });
    expect(result.current.tree).toEqual(mockTree);

    // Then get an error
    await act(async () => {
      await result.current.resolve("bad");
    });
    expect(result.current.error).toBe("Error");

    // Clear should reset both
    act(() => {
      result.current.clear();
    });

    expect(result.current.tree).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
