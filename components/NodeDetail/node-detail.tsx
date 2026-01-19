"use client";
import type { DependencyNode } from "@/modules/packages";
import { HealthBadge } from "@/components";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

interface NodeDetailProps {
  node: DependencyNode | null;
  onClose: () => void;
}

export default function NodeDetail({ node, onClose }: NodeDetailProps) {
  if (!node) return null;

  const { health } = node;

  return (
    <div className="fixed inset-y-0 right-0 z-20 w-80 border-l border-border bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium">{node.name}</h2>
          <p className="text-sm text-muted">{node.version}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-fg/5"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4">
        {/* Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Health Score</span>
          <HealthBadge score={health.overall} level={health.level} />
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            Breakdown
          </h3>
          <BreakdownRow
            label="Maintenance"
            value={health.breakdown.maintenance}
          />
          <BreakdownRow
            label="Popularity"
            value={health.breakdown.popularity}
          />
          <BreakdownRow label="Activity" value={health.breakdown.activity} />
          <BreakdownRow label="Security" value={health.breakdown.security} />
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            Stats
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Downloads</p>
              <p className="font-medium">
                {formatNumber(health.weeklyDownloads)}/wk
              </p>
            </div>
            <div>
              <p className="text-muted">Issues</p>
              <p className="font-medium">{health.openIssues} open</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2 pt-2">
          <ExternalLink href={`https://www.npmjs.com/package/${node.name}`}>
            npm
          </ExternalLink>
          <ExternalLink
            href={`https://github.com/search?q=${node.name}&type=repositories`}
          >
            GitHub
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
        <div
          className="h-full rounded-full bg-fg/40"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 rounded-md border border-border py-2 text-center text-sm transition-colors hover:bg-fg/5"
    >
      {children}
    </a>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
