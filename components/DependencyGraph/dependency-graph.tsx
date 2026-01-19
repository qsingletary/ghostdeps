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
    <div className="overflow-auto p-4 sm:p-6">
      <TreeNode
        node={root}
        onSelect={onSelectNode}
        selectedId={selectedId}
        depth={0}
      />
    </div>
  );
}

interface TreeNodeProps {
  node: DependencyNode;
  onSelect: (node: DependencyNode) => void;
  selectedId: string | null;
  depth: number;
}

function TreeNode({ node, onSelect, selectedId, depth }: TreeNodeProps) {
  const isSelected = node.id === selectedId;
  const hasChildren = node.dependencies.length > 0;
  const isRoot = depth === 0;

  return (
    <div className="relative" style={{ animationDelay: `${depth * 50}ms` }}>
      {!isRoot && (
        <div className="absolute -left-3 top-4 h-px w-3 bg-border sm:-left-4 sm:top-5 sm:w-4" />
      )}

      <button
        onClick={() => onSelect(node)}
        className={`group relative flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200 sm:w-auto sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3 ${
          isSelected
            ? "border-accent/50 bg-accent/10 shadow-lg shadow-accent/10"
            : "border-border hover:border-accent/30 hover:bg-surface hover:shadow-md"
        } ${isRoot ? "bg-surface" : "bg-bg"}`}
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors sm:h-10 sm:w-10 ${
            isSelected
              ? "bg-accent text-white"
              : "bg-accent/10 text-accent group-hover:bg-accent/20"
          }`}
        >
          {isRoot ? (
            <RootIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <PackageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-semibold ${isRoot ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}
          >
            {node.name}
          </p>
          <p className="text-[10px] text-muted sm:text-xs">{node.version}</p>
        </div>

        <HealthBadge
          score={node.health.overall}
          level={node.health.level}
          size="sm"
        />

        {hasChildren && (
          <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted/20 px-1 text-[9px] font-medium text-muted sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[10px]">
            {node.dependencies.length}
          </span>
        )}
      </button>

      {hasChildren && (
        <div className="relative ml-4 mt-2 space-y-2 border-l border-border pl-3 sm:ml-6 sm:mt-3 sm:space-y-3 sm:pl-4">
          {node.dependencies.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RootIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill="currentColor"
      />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.29 7 12 12l8.71-5M12 22V12" />
    </svg>
  );
}
