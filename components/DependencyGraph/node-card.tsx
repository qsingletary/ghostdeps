"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { HealthBadge } from "@/components";
import type { FlowNodeData } from "./use-graph-layout";

type FlowNode = Node<FlowNodeData, "package">;

export default function NodeCard({ data }: NodeProps<FlowNode>) {
  const node = data.pkg;
  const isSelected = data.selected;
  const isRoot = node.depth === 0;
  const hasWarnings = node.warnings.length > 0;

  return (
    <div
      className={`flex w-[220px] items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
        isSelected
          ? "border-accent/60 bg-accent/10 shadow-lg shadow-accent/10"
          : isRoot
            ? "border-border bg-surface"
            : "border-border bg-bg"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent"
      />

      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
          isSelected
            ? "bg-accent text-white"
            : "bg-accent/10 text-accent"
        }`}
      >
        <PackageIcon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{node.name}</p>
        <p className="truncate text-[10px] text-muted">{node.version}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        {hasWarnings && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full bg-warning/15 text-warning"
            title={`${node.warnings.length} supply-chain warning${
              node.warnings.length === 1 ? "" : "s"
            }`}
          >
            <AlertIcon className="h-2.5 w-2.5" />
          </span>
        )}
        <HealthBadge
          score={node.health.overall}
          level={node.health.level}
          size="sm"
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent"
      />
    </div>
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

function AlertIcon({ className }: { className?: string }) {
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
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
