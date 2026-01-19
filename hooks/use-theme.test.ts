import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// We need to reset the module's cached state between tests
let useTheme: typeof import("./use-theme").useTheme;

describe("useTheme", () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(async () => {
    // Clear localStorage mock before each test
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key],
    );

    // Mock localStorage
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => mockLocalStorage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
    );

    // Mock document.documentElement
    vi.spyOn(document.documentElement.classList, "add").mockImplementation(
      () => {},
    );
    vi.spyOn(document.documentElement.classList, "remove").mockImplementation(
      () => {},
    );

    // Reset the module to clear cached theme
    vi.resetModules();
    const themeModule = await import("./use-theme");
    useTheme = themeModule.useTheme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with dark theme by default", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
  });

  it("should load theme from localStorage", async () => {
    mockLocalStorage["theme"] = "light";

    // Re-import to get fresh module with light theme in localStorage
    vi.resetModules();
    const themeModule = await import("./use-theme");
    const { result } = renderHook(() => themeModule.useTheme());

    expect(result.current.theme).toBe("light");
  });

  it("should toggle theme from dark to light", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("light");
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");
  });

  it("should toggle theme from light to dark", () => {
    mockLocalStorage["theme"] = "light";

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("should add dark class to document when theme is dark", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("dark");
  });

  it("should remove dark class when theme is light", async () => {
    mockLocalStorage["theme"] = "light";

    // Re-import to get fresh module with light theme in localStorage
    vi.resetModules();
    const themeModule = await import("./use-theme");
    renderHook(() => themeModule.useTheme());

    expect(document.documentElement.classList.remove).toHaveBeenCalledWith(
      "dark",
    );
  });

  it("should return mounted state", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.mounted).toBe(true);
  });

  it("should persist theme changes to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");

    act(() => {
      result.current.toggle();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("should update document class on theme change", () => {
    const { result } = renderHook(() => useTheme());

    // Initial dark theme
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("dark");

    act(() => {
      result.current.toggle();
    });

    // After toggle to light
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith(
      "dark",
    );
  });
});
