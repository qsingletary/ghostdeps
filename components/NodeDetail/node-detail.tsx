"use client";
import type { DependencyNode } from "@/modules/packages";
import { HealthBadge, BookmarkButton } from "@/components";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

interface NodeDetailProps {
  node: DependencyNode | null;
  onClose: () => void;
}

export default function NodeDetail({ node, onClose }: NodeDetailProps) {
  if (!node) return null;

  const { health } = node;

  return (
    <>
      <div
        className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm sm:hidden"
        onClick={onClose}
      />

      <div className="animate-slide-in-right fixed inset-x-0 bottom-0 top-auto z-20 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border/50 bg-bg/95 backdrop-blur-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:w-96 sm:max-h-none sm:rounded-none sm:rounded-l-none sm:border-l sm:border-t-0">
        <div className="relative border-b border-border/50 bg-gradient-to-br from-accent/10 via-transparent to-transparent px-4 py-4 sm:px-6 sm:py-5">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted/30 sm:hidden" />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-bg/50 text-muted transition-all duration-200 hover:bg-bg hover:text-fg sm:right-4 sm:top-4"
          >
            <XIcon className="h-4 w-4" />
          </button>

          <div className="mt-2 flex items-start gap-3 pr-12 sm:mt-0 sm:gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/30 sm:h-14 sm:w-14 sm:rounded-2xl">
              <PackageIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold sm:text-lg">
                  {node.name}
                </h2>
                <BookmarkButton
                  name={node.name}
                  version={node.version}
                  healthScore={health.overall}
                  healthLevel={health.level}
                />
              </div>
              <p className="text-xs text-muted sm:text-sm">{node.version}</p>
            </div>
          </div>
        </div>

        <div
          className="space-y-5 overflow-auto p-4 sm:space-y-6 sm:p-6"
          style={{ maxHeight: "calc(85vh - 100px)" }}
        >
          <div className="rounded-xl bg-surface p-4 sm:rounded-2xl sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-xs">
                  Health Score
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {health.overall}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
                <HealthBadge
                  score={health.overall}
                  level={health.level}
                  size="md"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted sm:mb-4 sm:text-xs">
              Breakdown
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <BreakdownRow
                label="Maintenance"
                value={health.breakdown.maintenance}
                icon={<WrenchIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
              <BreakdownRow
                label="Popularity"
                value={health.breakdown.popularity}
                icon={<StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
              <BreakdownRow
                label="Activity"
                value={health.breakdown.activity}
                icon={<ActivityIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
              <BreakdownRow
                label="Security"
                value={health.breakdown.security}
                icon={<ShieldIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted sm:mb-4 sm:text-xs">
              Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <StatCard
                label="Downloads"
                value={`${formatNumber(health.weeklyDownloads)}/wk`}
                icon={<DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
              <StatCard
                label="Open Issues"
                value={String(health.openIssues)}
                icon={<IssueIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted sm:mb-4 sm:text-xs">
              Links
            </h3>
            <div className="flex gap-2 sm:gap-3">
              <ExternalLink
                href={`https://www.npmjs.com/package/${node.name}`}
                icon={<NpmIcon className="h-4 w-4" />}
              >
                npm
              </ExternalLink>
              <ExternalLink
                href={`https://github.com/search?q=${node.name}&type=repositories`}
                icon={<GitHubIcon className="h-4 w-4" />}
              >
                GitHub
              </ExternalLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BreakdownRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const getBarColor = (val: number) => {
    if (val >= 70) return "bg-healthy";
    if (val >= 40) return "bg-warning";
    return "bg-critical";
  };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-muted sm:gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/50 sm:h-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface p-3 sm:rounded-xl sm:p-4">
      <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent sm:mb-2 sm:h-8 sm:w-8 sm:rounded-lg">
        {icon}
      </div>
      <p className="text-[10px] text-muted sm:text-xs">{label}</p>
      <p className="mt-0.5 text-base font-bold sm:text-lg">{value}</p>
    </div>
  );
}

function ExternalLink({ href, children, icon }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2.5 text-xs font-medium transition-all duration-200 hover:border-accent/50 hover:bg-accent/10 hover:text-accent sm:gap-2 sm:rounded-xl sm:py-3 sm:text-sm"
    >
      {icon}
      {children}
    </a>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
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

function WrenchIcon({ className }: { className?: string }) {
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
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
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
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function IssueIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function NpmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
