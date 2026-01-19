import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUIStore } from "./ui-store";
import type { DependencyNode } from "@/modules/packages";

describe("useUIStore", () => {
  // Reset store state before each test
  beforeEach(() => {
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.reset();
    });
  });

  const createNode = (name = "test", depth = 0): DependencyNode => ({
    id: `${name}@1.0.0`,
    name,
    version: "1.0.0",
    health: {
      overall: 85,
      level: "healthy",
      breakdown: { maintenance: 90, popularity: 80, activity: 85, security: 100 },
      vulnerabilities: [],
      lastPublish: "2024-01-01",
      weeklyDownloads: 50000,
      openIssues: 10,
      closedIssues: 90,
    },
    depth,
    dependencies: [],
  });

  describe("initial state", () => {
    it("should have null selectedNode", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.selectedNode).toBeNull();
    });

    it("should have default maxDepth of 5", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.maxDepth).toBe(5);
    });
  });

  describe("setSelectedNode", () => {
    it("should set selected node", () => {
      const { result } = renderHook(() => useUIStore());
      const node = createNode("lodash");

      act(() => {
        result.current.setSelectedNode(node);
      });

      expect(result.current.selectedNode).toEqual(node);
    });

    it("should clear selected node when set to null", () => {
      const { result } = renderHook(() => useUIStore());
      const node = createNode("lodash");

      act(() => {
        result.current.setSelectedNode(node);
      });

      expect(result.current.selectedNode).toEqual(node);

      act(() => {
        result.current.setSelectedNode(null);
      });

      expect(result.current.selectedNode).toBeNull();
    });

    it("should replace existing selected node", () => {
      const { result } = renderHook(() => useUIStore());
      const node1 = createNode("lodash");
      const node2 = createNode("react");

      act(() => {
        result.current.setSelectedNode(node1);
      });

      expect(result.current.selectedNode?.name).toBe("lodash");

      act(() => {
        result.current.setSelectedNode(node2);
      });

      expect(result.current.selectedNode?.name).toBe("react");
    });
  });

  describe("setMaxDepth", () => {
    it("should set max depth within valid range", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setMaxDepth(3);
      });

      expect(result.current.maxDepth).toBe(3);

      act(() => {
        result.current.setMaxDepth(7);
      });

      expect(result.current.maxDepth).toBe(7);
    });

    it("should clamp max depth to minimum of 1", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setMaxDepth(0);
      });

      expect(result.current.maxDepth).toBe(1);

      act(() => {
        result.current.setMaxDepth(-5);
      });

      expect(result.current.maxDepth).toBe(1);
    });

    it("should clamp max depth to maximum of 10", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setMaxDepth(15);
      });

      expect(result.current.maxDepth).toBe(10);

      act(() => {
        result.current.setMaxDepth(100);
      });

      expect(result.current.maxDepth).toBe(10);
    });
  });

  describe("reset", () => {
    it("should reset selected node to null", () => {
      const { result } = renderHook(() => useUIStore());
      const node = createNode("lodash");

      act(() => {
        result.current.setSelectedNode(node);
      });

      expect(result.current.selectedNode).toEqual(node);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedNode).toBeNull();
    });

    it("should reset max depth to default 5", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setMaxDepth(8);
      });

      expect(result.current.maxDepth).toBe(8);

      act(() => {
        result.current.reset();
      });

      expect(result.current.maxDepth).toBe(5);
    });

    it("should reset all state at once", () => {
      const { result } = renderHook(() => useUIStore());
      const node = createNode("lodash");

      act(() => {
        result.current.setSelectedNode(node);
        result.current.setMaxDepth(8);
      });

      expect(result.current.selectedNode).toEqual(node);
      expect(result.current.maxDepth).toBe(8);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedNode).toBeNull();
      expect(result.current.maxDepth).toBe(5);
    });
  });

  describe("store persistence across components", () => {
    it("should share state across multiple hooks", () => {
      const { result: result1 } = renderHook(() => useUIStore());
      const { result: result2 } = renderHook(() => useUIStore());
      const node = createNode("lodash");

      act(() => {
        result1.current.setSelectedNode(node);
      });

      expect(result1.current.selectedNode).toEqual(node);
      expect(result2.current.selectedNode).toEqual(node);
    });

    it("should sync maxDepth across hooks", () => {
      const { result: result1 } = renderHook(() => useUIStore());
      const { result: result2 } = renderHook(() => useUIStore());

      act(() => {
        result1.current.setMaxDepth(8);
      });

      expect(result1.current.maxDepth).toBe(8);
      expect(result2.current.maxDepth).toBe(8);
    });
  });
});
