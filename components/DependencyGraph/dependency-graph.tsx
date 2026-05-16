"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { DependencyNode } from "@/modules/packages";
import TreeView from "./tree-view";
import ViewToggle, { type ViewMode } from "./view-toggle";

const GraphView = dynamic(() => import("./graph-view"), {
  ssr: false,
  loading: () => <GraphLoading />,
});

interface DependencyGraphProps {
  root: DependencyNode;
  onSelectNode: (node: DependencyNode) => void;
  selectedId: string | null;
}

export default function DependencyGraph({
  root,
  onSelectNode,
  selectedId,
}: DependencyGraphProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-end border-b border-border/30 bg-surface/30 px-4 py-2 sm:px-6">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "tree" ? (
        <TreeView
          root={root}
          onSelectNode={onSelectNode}
          selectedId={selectedId}
        />
      ) : (
        <GraphView
          root={root}
          onSelectNode={onSelectNode}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}

function GraphLoading() {
  return (
    <div className="flex h-[calc(100vh-220px)] items-center justify-center bg-bg">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
        </div>
        <p className="text-sm text-muted">Loading graph…</p>
      </div>
    </div>
  );
}
