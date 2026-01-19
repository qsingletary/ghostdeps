"use client";

import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  if (!mounted) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-surface" />;
  }

  return (
    <button
      onClick={toggle}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-bg"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <SunIcon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 text-accent"
            : "rotate-90 scale-0 text-accent"
        }`}
      />

      <MoonIcon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === "dark"
            ? "-rotate-90 scale-0 text-accent"
            : "rotate-0 scale-100 text-accent"
        }`}
      />
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
