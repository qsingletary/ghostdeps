"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search packages...",
  isLoading,
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="group relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-accent">
        <SearchIcon className="h-4 w-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-11 text-sm transition-all duration-200 placeholder:text-muted/70 hover:border-accent/30 focus:border-accent/50 focus:bg-bg focus:outline-none focus:ring-2 focus:ring-accent/20"
      />

      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {isLoading ? (
          <Spinner />
        ) : (
          <kbd className="hidden rounded-md border border-border bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted group-focus-within:inline-block">
            Enter
          </kbd>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-accent"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
