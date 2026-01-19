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
    healthy: "bg-healthy/15 text-healthy",
    warning: "bg-warning/15 text-warning",
    critical: "bg-critical/15 text-critical",
    unknown: "bg-muted/15 text-muted",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${colors[level]} ${sizes[size]}`}
    >
      {score}
    </span>
  );
}
