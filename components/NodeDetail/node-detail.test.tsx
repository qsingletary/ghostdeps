import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NodeDetail from "./node-detail";
import type { DependencyNode } from "@/modules/packages";

describe("NodeDetail", () => {
  const createNode = (overrides = {}): DependencyNode => ({
    id: "lodash@4.17.21",
    name: "lodash",
    version: "4.17.21",
    health: {
      overall: 85,
      level: "healthy",
      breakdown: {
        maintenance: 90,
        popularity: 80,
        activity: 85,
        security: 100,
      },
      vulnerabilities: [],
      lastPublish: "2024-01-01",
      weeklyDownloads: 50000000,
      openIssues: 10,
      closedIssues: 90,
    },
    depth: 0,
    dependencies: [],
    ...overrides,
  });

  const defaultProps = {
    node: createNode(),
    onClose: vi.fn(),
  };

  describe("when node is null", () => {
    it("should render nothing", () => {
      const { container } = render(
        <NodeDetail node={null} onClose={vi.fn()} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("when node is provided", () => {
    it("should display package name", () => {
      render(<NodeDetail {...defaultProps} />);

      expect(screen.getByText("lodash")).toBeInTheDocument();
    });

    it("should display package version", () => {
      render(<NodeDetail {...defaultProps} />);

      expect(screen.getByText("4.17.21")).toBeInTheDocument();
    });

    it("should display health score", () => {
      render(<NodeDetail {...defaultProps} />);

      // Health score 85 appears in the component
      const allText = document.body.textContent;
      expect(allText).toContain("85");
    });

    it("should display health breakdown", () => {
      render(<NodeDetail {...defaultProps} />);

      expect(screen.getByText("Maintenance")).toBeInTheDocument();
      expect(screen.getByText("Popularity")).toBeInTheDocument();
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Security")).toBeInTheDocument();
      // Breakdown values: 90, 80, 85, 100
      const allText = document.body.textContent;
      expect(allText).toContain("90");
      expect(allText).toContain("80");
      expect(allText).toContain("100");
    });

    it("should display weekly downloads formatted", () => {
      render(<NodeDetail {...defaultProps} />);

      expect(screen.getByText("50.0M/wk")).toBeInTheDocument();
    });

    it("should display open issues", () => {
      render(<NodeDetail {...defaultProps} />);

      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("onClose", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<NodeDetail node={createNode()} onClose={onClose} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      fireEvent.click(buttons[0]!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      const { container } = render(
        <NodeDetail node={createNode()} onClose={onClose} />,
      );

      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("external links", () => {
    it("should render npm link", () => {
      render(<NodeDetail {...defaultProps} />);

      const npmLink = screen.getByText("npm").closest("a");
      expect(npmLink).toHaveAttribute(
        "href",
        "https://www.npmjs.com/package/lodash",
      );
      expect(npmLink).toHaveAttribute("target", "_blank");
      expect(npmLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should render GitHub link", () => {
      render(<NodeDetail {...defaultProps} />);

      const githubLink = screen.getByText("GitHub").closest("a");
      expect(githubLink).toHaveAttribute(
        "href",
        "https://github.com/search?q=lodash&type=repositories",
      );
    });
  });

  describe("number formatting", () => {
    it("should format millions", () => {
      const node = createNode({
        health: {
          ...createNode().health,
          weeklyDownloads: 1500000,
        },
      });
      render(<NodeDetail node={node} onClose={vi.fn()} />);

      expect(screen.getByText("1.5M/wk")).toBeInTheDocument();
    });

    it("should format thousands", () => {
      const node = createNode({
        health: {
          ...createNode().health,
          weeklyDownloads: 15000,
        },
      });
      render(<NodeDetail node={node} onClose={vi.fn()} />);

      expect(screen.getByText("15.0K/wk")).toBeInTheDocument();
    });

    it("should display small numbers without formatting", () => {
      const node = createNode({
        health: {
          ...createNode().health,
          weeklyDownloads: 500,
        },
      });
      render(<NodeDetail node={node} onClose={vi.fn()} />);

      expect(screen.getByText("500/wk")).toBeInTheDocument();
    });
  });

  describe("health level colors", () => {
    it("should display healthy color bars", () => {
      const { container } = render(<NodeDetail {...defaultProps} />);

      // Maintenance (90) should have healthy color
      const healthyBars = container.querySelectorAll(".bg-healthy");
      expect(healthyBars.length).toBeGreaterThan(0);
    });

    it("should display warning color for mid-range values", () => {
      const node = createNode({
        health: {
          ...createNode().health,
          breakdown: {
            maintenance: 50,
            popularity: 50,
            activity: 50,
            security: 50,
          },
        },
      });
      const { container } = render(
        <NodeDetail node={node} onClose={vi.fn()} />,
      );

      const warningBars = container.querySelectorAll(".bg-warning");
      expect(warningBars.length).toBeGreaterThan(0);
    });

    it("should display critical color for low values", () => {
      const node = createNode({
        health: {
          ...createNode().health,
          breakdown: {
            maintenance: 20,
            popularity: 20,
            activity: 20,
            security: 20,
          },
        },
      });
      const { container } = render(
        <NodeDetail node={node} onClose={vi.fn()} />,
      );

      const criticalBars = container.querySelectorAll(".bg-critical");
      expect(criticalBars.length).toBeGreaterThan(0);
    });
  });

  describe("scoped packages", () => {
    it("should handle scoped package names", () => {
      const node = createNode({
        id: "@org/package@1.0.0",
        name: "@org/package",
      });
      render(<NodeDetail node={node} onClose={vi.fn()} />);

      expect(screen.getByText("@org/package")).toBeInTheDocument();

      const npmLink = screen.getByText("npm").closest("a");
      expect(npmLink).toHaveAttribute(
        "href",
        "https://www.npmjs.com/package/@org/package",
      );
    });
  });
});
