import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TreeStats from "./tree-stats";
import type { BundleSize, TreeStats as TreeStatsType } from "@/modules/packages";

describe("TreeStats", () => {
  const defaultStats: TreeStatsType = {
    totalPackages: 150,
    uniquePackages: 120,
    maxDepth: 5,
    healthDistribution: {
      healthy: 80,
      warning: 30,
      critical: 10,
      unknown: 0,
    },
  };

  describe("package stats", () => {
    it("should display total packages", () => {
      render(<TreeStats stats={defaultStats} />);

      expect(screen.getByText("Packages")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("should display unique packages", () => {
      render(<TreeStats stats={defaultStats} />);

      expect(screen.getByText("Unique")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("should display max depth", () => {
      render(<TreeStats stats={defaultStats} />);

      expect(screen.getByText("Depth")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  describe("health distribution", () => {
    it("should display health distribution counts", () => {
      render(<TreeStats stats={defaultStats} />);

      // Healthy count is 80, Warning is 30, Critical is 10
      // These appear alongside their color indicators
      const allText = document.body.textContent;
      expect(allText).toContain("80");
      expect(allText).toContain("30");
      expect(allText).toContain("10");
    });

    it("should render health indicators with correct colors", () => {
      const { container } = render(<TreeStats stats={defaultStats} />);

      expect(container.querySelector(".bg-healthy")).toBeInTheDocument();
      expect(container.querySelector(".bg-warning")).toBeInTheDocument();
      expect(container.querySelector(".bg-critical")).toBeInTheDocument();
    });
  });

  describe("icons", () => {
    it("should render all icons", () => {
      const { container } = render(<TreeStats stats={defaultStats} />);

      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("edge cases", () => {
    it("should handle zero values", () => {
      const zeroStats: TreeStatsType = {
        totalPackages: 0,
        uniquePackages: 0,
        maxDepth: 0,
        healthDistribution: {
          healthy: 0,
          warning: 0,
          critical: 0,
          unknown: 0,
        },
      };

      render(<TreeStats stats={zeroStats} />);

      // Should render multiple zeros
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle large numbers", () => {
      const largeStats: TreeStatsType = {
        totalPackages: 99999,
        uniquePackages: 88888,
        maxDepth: 10,
        healthDistribution: {
          healthy: 50000,
          warning: 30000,
          critical: 19999,
          unknown: 0,
        },
      };

      render(<TreeStats stats={largeStats} />);

      expect(screen.getByText("99999")).toBeInTheDocument();
      expect(screen.getByText("88888")).toBeInTheDocument();
    });

    it("should handle single package tree", () => {
      const singleStats: TreeStatsType = {
        totalPackages: 1,
        uniquePackages: 1,
        maxDepth: 0,
        healthDistribution: {
          healthy: 1,
          warning: 0,
          critical: 0,
          unknown: 0,
        },
      };

      render(<TreeStats stats={singleStats} />);

      expect(screen.getAllByText("1")).toHaveLength(3); // total, unique, healthy
    });
  });

  describe("root bundle pill", () => {
    const bundle = (overrides: Partial<BundleSize> = {}): BundleSize => ({
      minified: 100_000,
      gzipped: 24_576,
      dependencyCount: 0,
      hasJSModule: true,
      hasSideEffects: false,
      isModuleType: true,
      ...overrides,
    });

    it("renders a bundle pill when rootBundle is provided", () => {
      render(<TreeStats stats={defaultStats} rootBundle={bundle()} />);
      expect(screen.getByText("Bundle")).toBeInTheDocument();
      expect(screen.getByText("24.0KB")).toBeInTheDocument();
    });

    it("formats large bundles in MB", () => {
      render(
        <TreeStats stats={defaultStats} rootBundle={bundle({ gzipped: 2 * 1024 * 1024 })} />,
      );
      expect(screen.getByText("2.0MB")).toBeInTheDocument();
    });

    it("does not render the pill when rootBundle is null", () => {
      render(<TreeStats stats={defaultStats} rootBundle={null} />);
      expect(screen.queryByText("Bundle")).not.toBeInTheDocument();
    });

    it("does not render the pill when rootBundle is omitted", () => {
      render(<TreeStats stats={defaultStats} />);
      expect(screen.queryByText("Bundle")).not.toBeInTheDocument();
    });
  });
});
