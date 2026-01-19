import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./theme-toggle";
import * as useThemeModule from "@/hooks/use-theme";

vi.mock("@/hooks/use-theme");

describe("ThemeToggle", () => {
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when not mounted", () => {
    it("should render a placeholder", () => {
      vi.mocked(useThemeModule.useTheme).mockReturnValue({
        theme: "dark",
        toggle: mockToggle,
        mounted: false,
      });

      const { container } = render(<ThemeToggle />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("when mounted with dark theme", () => {
    beforeEach(() => {
      vi.mocked(useThemeModule.useTheme).mockReturnValue({
        theme: "dark",
        toggle: mockToggle,
        mounted: true,
      });
    });

    it("should render a button", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have correct aria-label for dark mode", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Switch to light mode",
      );
    });

    it("should call toggle when clicked", () => {
      render(<ThemeToggle />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("should show sun icon visible (scale-100)", () => {
      const { container } = render(<ThemeToggle />);

      const sunIcon = container.querySelector("svg:first-of-type");
      expect(sunIcon).toHaveClass("scale-100");
    });
  });

  describe("when mounted with light theme", () => {
    beforeEach(() => {
      vi.mocked(useThemeModule.useTheme).mockReturnValue({
        theme: "light",
        toggle: mockToggle,
        mounted: true,
      });
    });

    it("should have correct aria-label for light mode", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Switch to dark mode",
      );
    });

    it("should show moon icon visible (scale-100)", () => {
      const { container } = render(<ThemeToggle />);

      // The moon icon is the second svg
      const icons = container.querySelectorAll("button svg");
      const moonIcon = icons[1];
      expect(moonIcon).toHaveClass("scale-100");
    });
  });

  describe("accessibility", () => {
    it("should be focusable", () => {
      vi.mocked(useThemeModule.useTheme).mockReturnValue({
        theme: "dark",
        toggle: mockToggle,
        mounted: true,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });
  });
});
