import { describe, it, expect } from "vitest";
import { buildGraphLayout, NODE_DIMENSIONS } from "./use-graph-layout";
import type { DependencyNode, HealthScore } from "@/modules/packages";

const health = (level: HealthScore["level"] = "healthy"): HealthScore => ({
  overall: 80,
  level,
  breakdown: {
    maintenance: 80,
    popularity: 80,
    activity: 80,
    security: 80,
    size: 80,
  },
  vulnerabilities: [],
  bundle: null,
  license: { spdx: "MIT", category: "permissive" },
  lastPublish: "2024-01-01",
  weeklyDownloads: 1000,
  openIssues: 0,
  closedIssues: 0,
});

const makeNode = (
  name: string,
  dependencies: DependencyNode[] = [],
  overrides: Partial<DependencyNode> = {},
): DependencyNode => ({
  id: `${name}@1.0.0`,
  name,
  version: "1.0.0",
  health: health(),
  depth: 0,
  dependencies,
  warnings: [],
  ...overrides,
});

describe("buildGraphLayout", () => {
  it("returns a single node with one position for a leaf root", () => {
    const root = makeNode("solo");

    const layout = buildGraphLayout(root);

    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
    expect(layout.nodes[0]!.id).toBe("solo@1.0.0");
    expect(layout.nodes[0]!.type).toBe("package");
    expect(layout.nodes[0]!.position).toBeDefined();
  });

  it("produces one node and one edge per dependency link", () => {
    const leaf = makeNode("leaf");
    const branch = makeNode("branch", [leaf]);
    const root = makeNode("root", [branch]);

    const layout = buildGraphLayout(root);

    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(2);
    expect(layout.edges.map((e) => e.source)).toEqual([
      "root@1.0.0",
      "branch@1.0.0",
    ]);
    expect(layout.edges.map((e) => e.target)).toEqual([
      "branch@1.0.0",
      "leaf@1.0.0",
    ]);
  });

  it("deduplicates nodes that appear in multiple branches of the tree", () => {
    const shared = makeNode("shared");
    const root = makeNode("root", [
      makeNode("a", [shared]),
      makeNode("b", [shared]),
    ]);

    const layout = buildGraphLayout(root);

    // root + a + b + shared = 4 unique nodes
    expect(layout.nodes).toHaveLength(4);
    // root->a, root->b, a->shared, b->shared = 4 edges
    expect(layout.edges).toHaveLength(4);

    const sharedNodes = layout.nodes.filter(
      (n) => n.id === "shared@1.0.0",
    );
    expect(sharedNodes).toHaveLength(1);
  });

  it("marks the selected node in its data payload", () => {
    const root = makeNode("root", [makeNode("dep")]);
    const layout = buildGraphLayout(root, "dep@1.0.0");

    const rootNode = layout.nodes.find((n) => n.id === "root@1.0.0");
    const depNode = layout.nodes.find((n) => n.id === "dep@1.0.0");
    expect(rootNode!.data.selected).toBe(false);
    expect(depNode!.data.selected).toBe(true);
  });

  it("animates edges that point to a critical-health child", () => {
    const critical = makeNode("vuln", [], {
      health: { ...health("critical"), overall: 20 },
    });
    const root = makeNode("root", [critical]);

    const layout = buildGraphLayout(root);
    const edge = layout.edges.find((e) => e.target === "vuln@1.0.0");
    expect(edge?.animated).toBe(true);
  });

  it("does not animate edges to healthy children", () => {
    const root = makeNode("root", [makeNode("dep")]);
    const layout = buildGraphLayout(root);
    const edge = layout.edges[0];
    expect(edge?.animated).toBe(false);
  });

  it("positions are spread out — root y is less than child y in top-to-bottom layout", () => {
    const root = makeNode("root", [makeNode("dep")]);
    const layout = buildGraphLayout(root);

    const rootPos = layout.nodes.find((n) => n.id === "root@1.0.0")!.position;
    const depPos = layout.nodes.find((n) => n.id === "dep@1.0.0")!.position;

    expect(rootPos.y).toBeLessThan(depPos.y);
  });

  it("exposes node dimensions for downstream sizing", () => {
    expect(NODE_DIMENSIONS.width).toBeGreaterThan(0);
    expect(NODE_DIMENSIONS.height).toBeGreaterThan(0);
  });
});
