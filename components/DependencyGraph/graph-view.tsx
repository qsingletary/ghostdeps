"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DependencyNode } from "@/modules/packages";
import NodeCard from "./node-card";
import { useGraphLayout } from "./use-graph-layout";

interface GraphViewProps {
  root: DependencyNode;
  onSelectNode: (node: DependencyNode) => void;
  selectedId: string | null;
}

const NODE_TYPES = { package: NodeCard };

const MINIMAP_NODE_COLOR = (node: { data?: unknown }) => {
  const pkg = (node.data as { pkg?: DependencyNode })?.pkg;
  if (!pkg) return "#888";
  switch (pkg.health.level) {
    case "healthy":
      return "#22c55e";
    case "warning":
      return "#eab308";
    case "critical":
      return "#ef4444";
    default:
      return "#888";
  }
};

export default function GraphView({
  root,
  onSelectNode,
  selectedId,
}: GraphViewProps) {
  const { nodes, edges } = useGraphLayout(root, selectedId);

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    const pkg = (node.data as { pkg?: DependencyNode })?.pkg;
    if (pkg) onSelectNode(pkg);
  };

  return (
    <div className="h-[calc(100vh-220px)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} className="!bg-bg" />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-border/50 !bg-surface !shadow-sm"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor={MINIMAP_NODE_COLOR}
          className="!rounded-lg !border !border-border/50 !bg-surface !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}
