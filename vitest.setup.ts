import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

global.fetch = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});
