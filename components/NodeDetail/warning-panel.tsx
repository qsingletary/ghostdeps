import type {
  SupplyChainWarning,
  WarningKind,
  WarningSeverity,
} from "@/modules/packages";

interface WarningPanelProps {
  warnings: SupplyChainWarning[];
}

export default function WarningPanel({ warnings }: WarningPanelProps) {
  if (warnings.length === 0) return null;

  const sorted = [...warnings].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  );

  return (
    <div>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted sm:mb-4 sm:text-xs">
        Supply-chain ({warnings.length})
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {sorted.map((warning, i) => (
          <WarningCard key={`${warning.kind}-${i}`} warning={warning} />
        ))}
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: SupplyChainWarning }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <KindIcon kind={warning.kind} />
        <SeverityPill severity={warning.severity} />
        <span className="truncate text-[10px] font-mono uppercase tracking-wider text-muted sm:text-xs">
          {kindLabel(warning.kind)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-snug sm:text-sm">{warning.message}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: WarningSeverity }) {
  const styles: Record<WarningSeverity, string> = {
    high: "bg-critical/15 text-critical",
    moderate: "bg-warning/15 text-warning",
    low: "bg-accent/10 text-accent",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-xs ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

function KindIcon({ kind }: { kind: WarningKind }) {
  const Icon = ICONS[kind];
  return <Icon className="h-3.5 w-3.5 text-muted sm:h-4 sm:w-4" />;
}

function severityRank(severity: WarningSeverity): number {
  switch (severity) {
    case "high":
      return 3;
    case "moderate":
      return 2;
    case "low":
      return 1;
  }
}

function kindLabel(kind: WarningKind): string {
  switch (kind) {
    case "typosquat":
      return "Typosquat";
    case "new-popularity":
      return "Sudden traction";
    case "single-maintainer-new":
      return "Solo + new";
  }
}

function TyposquatIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function PopularityIcon({ className }: { className?: string }) {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function SoloIcon({ className }: { className?: string }) {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const ICONS: Record<WarningKind, (props: { className?: string }) => React.JSX.Element> = {
  typosquat: TyposquatIcon,
  "new-popularity": PopularityIcon,
  "single-maintainer-new": SoloIcon,
};
