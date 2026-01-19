import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HealthBadge from "./health-badge";

describe("HealthBadge", () => {
  describe("rendering", () => {
    it("should render the score", () => {
      render(<HealthBadge score={85} level="healthy" />);

      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("should render with default size (md)", () => {
      const { container } = render(<HealthBadge score={85} level="healthy" />);

      expect(container.firstChild).toHaveClass("px-3");
      expect(container.firstChild).toHaveClass("text-sm");
    });

    it("should render with small size", () => {
      const { container } = render(
        <HealthBadge score={85} level="healthy" size="sm" />,
      );

      expect(container.firstChild).toHaveClass("px-2");
      expect(container.firstChild).toHaveClass("text-xs");
    });
  });

  describe("health level styling", () => {
    it("should apply healthy styles", () => {
      const { container } = render(<HealthBadge score={85} level="healthy" />);

      expect(container.firstChild).toHaveClass("text-healthy");
      expect(container.firstChild).toHaveClass("bg-healthy/15");
    });

    it("should apply warning styles", () => {
      const { container } = render(<HealthBadge score={50} level="warning" />);

      expect(container.firstChild).toHaveClass("text-warning");
      expect(container.firstChild).toHaveClass("bg-warning/15");
    });

    it("should apply critical styles", () => {
      const { container } = render(<HealthBadge score={20} level="critical" />);

      expect(container.firstChild).toHaveClass("text-critical");
      expect(container.firstChild).toHaveClass("bg-critical/15");
    });

    it("should apply unknown styles", () => {
      const { container } = render(<HealthBadge score={0} level="unknown" />);

      expect(container.firstChild).toHaveClass("text-muted");
      expect(container.firstChild).toHaveClass("bg-muted/15");
    });
  });

  describe("dot indicator", () => {
    it("should render dot with healthy color", () => {
      const { container } = render(<HealthBadge score={85} level="healthy" />);

      const dot = container.querySelector("span > span");
      expect(dot).toHaveClass("bg-healthy");
    });

    it("should render dot with warning color", () => {
      const { container } = render(<HealthBadge score={50} level="warning" />);

      const dot = container.querySelector("span > span");
      expect(dot).toHaveClass("bg-warning");
    });

    it("should render dot with critical color", () => {
      const { container } = render(<HealthBadge score={20} level="critical" />);

      const dot = container.querySelector("span > span");
      expect(dot).toHaveClass("bg-critical");
    });

    it("should render dot with correct size for sm", () => {
      const { container } = render(
        <HealthBadge score={85} level="healthy" size="sm" />,
      );

      const dot = container.querySelector("span > span");
      expect(dot).toHaveClass("h-1.5");
      expect(dot).toHaveClass("w-1.5");
    });

    it("should render dot with correct size for md", () => {
      const { container } = render(
        <HealthBadge score={85} level="healthy" size="md" />,
      );

      const dot = container.querySelector("span > span");
      expect(dot).toHaveClass("h-2");
      expect(dot).toHaveClass("w-2");
    });
  });
});
