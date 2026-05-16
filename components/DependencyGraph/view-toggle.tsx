"use client";

export type ViewMode = "tree" | "graph";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
      <ToggleButton
        active={value === "tree"}
        onClick={() => onChange("tree")}
        icon={<TreeIcon className="h-3.5 w-3.5" />}
        label="Tree"
      />
      <ToggleButton
        active={value === "graph"}
        onClick={() => onChange("graph")}
        icon={<GraphIcon className="h-3.5 w-3.5" />}
        label="Graph"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
        active
          ? "bg-accent text-white"
          : "text-muted hover:bg-bg hover:text-fg"
      }`}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TreeIcon({ className }: { className?: string }) {
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
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <line x1="4" y1="6" x2="5" y2="6" />
      <line x1="4" y1="12" x2="5" y2="12" />
      <line x1="4" y1="18" x2="5" y2="18" />
    </svg>
  );
}

function GraphIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="12" y1="7" x2="5" y2="17" />
      <line x1="12" y1="7" x2="19" y2="17" />
    </svg>
  );
}
