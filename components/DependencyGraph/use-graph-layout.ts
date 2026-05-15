import { useMemo } from "react";
import dagre from "dagre";
import type { DependencyNode } from "@/modules/packages";

export type FlowNodeData = {
  pkg: DependencyNode;
  selected: boolean;
} & Record<string, unknown>;

export interface FlowNode {
  id: string;
  type: "package";
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface GraphLayout {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const RANK_SEP = 100;
const NODE_SEP = 40;

/**
 * Walk the dependency tree once and produce a deduplicated set of
 * react-flow nodes + edges, plus a dagre-computed top-to-bottom layout.
 *
 * The resolver already deduplicates by package id (returning the same
 * node object with a new `parent` pointer when a transitive dependency
 * is visited twice), so this walk uses a `seen` set to ensure each node
 * is laid out once even though it may appear in many parent's
 * `dependencies` arrays.
 */
export function buildGraphLayout(
  root: DependencyNode,
  selectedId: string | null = null,
): GraphLayout {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: "TB",
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: 24,
    marginy: 24,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const seen = new Set<string>();
  const edgeKeys = new Set<string>();

  const visit = (node: DependencyNode, parentId?: string): void => {
    const isNew = !seen.has(node.id);
    if (isNew) {
      seen.add(node.id);
      nodes.push({
        id: node.id,
        type: "package",
        position: { x: 0, y: 0 },
        data: { pkg: node, selected: selectedId === node.id },
      });
      graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    if (parentId) {
      const edgeId = `${parentId}->${node.id}`;
      if (!edgeKeys.has(edgeId)) {
        edgeKeys.add(edgeId);
        edges.push({
          id: edgeId,
          source: parentId,
          target: node.id,
          animated: node.health.level === "critical",
        });
        graph.setEdge(parentId, node.id);
      }
    }

    if (isNew) {
      for (const child of node.dependencies) {
        visit(child, node.id);
      }
    }
  };

  visit(root);
  dagre.layout(graph);

  const positioned = nodes.map((n) => {
    const { x, y } = graph.node(n.id);
    return {
      ...n,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: positioned, edges };
}

export function useGraphLayout(
  root: DependencyNode,
  selectedId: string | null,
): GraphLayout {
  return useMemo(() => buildGraphLayout(root, selectedId), [root, selectedId]);
}

export const NODE_DIMENSIONS = { width: NODE_WIDTH, height: NODE_HEIGHT } as const;
