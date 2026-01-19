"use client";

import type { DependencyNode } from "@/modules/packages";
import { HealthBadge } from "@/components";

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
  return (
    <div className="overflow-auto p-4">
      <TreeNode node={root} onSelect={onSelectNode} selectedId={selectedId} />
    </div>
  );
}

interface TreeNodeProps {
  node: DependencyNode;
  onSelect: (node: DependencyNode) => void;
  selectedId: string | null;
}

function TreeNode({ node, onSelect, selectedId }: TreeNodeProps) {
  const isSelected = node.id === selectedId;
  const hasChildren = node.dependencies.length > 0;

  return (
    <div className="relative">
      {/* Node */}
      <button
        onClick={() => onSelect(node)}
        className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
          isSelected
            ? "border-fg/30 bg-fg/5"
            : "border-border hover:border-fg/20 hover:bg-fg/[0.02]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{node.name}</p>
          <p className="text-xs text-muted">{node.version}</p>
        </div>
        <HealthBadge
          score={node.health.overall}
          level={node.health.level}
          size="sm"
        />
      </button>

      {/* Children */}
      {hasChildren && (
        <div className="ml-4 mt-2 space-y-2 border-l border-border pl-4">
          {node.dependencies.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
