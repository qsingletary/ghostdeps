import type { HealthLevel } from "@/modules/packages";

interface HealthBadgeProps {
  score: number;
  level: HealthLevel;
  size?: "sm" | "md";
}

export default function HealthBadge({
  score,
  level,
  size = "md",
}: HealthBadgeProps) {
  const colors: Record<HealthLevel, string> = {
    healthy: "bg-healthy/15 text-healthy border-healthy/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    critical: "bg-critical/15 text-critical border-critical/30",
    unknown: "bg-muted/15 text-muted border-muted/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
  };

  const dotColors: Record<HealthLevel, string> = {
    healthy: "bg-healthy",
    warning: "bg-warning",
    critical: "bg-critical",
    unknown: "bg-muted",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold transition-all ${colors[level]} ${sizes[size]}`}
    >
      <span className={`rounded-full ${dotColors[level]} ${dotSizes[size]}`} />
      {score}
    </span>
  );
}
