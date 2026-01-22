"use client";

import { useBookmarkStore } from "@/stores";
import type { HealthLevel } from "@/modules/packages";

interface BookmarkButtonProps {
  name: string;
  version: string;
  healthScore: number;
  healthLevel: HealthLevel;
}

export default function BookmarkButton({
  name,
  version,
  healthScore,
  healthLevel,
}: BookmarkButtonProps) {
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(name));

  const handleToggle = () => {
    if (isBookmarked) {
      removeBookmark(name);
    } else {
      addBookmark({ name, version, healthScore, healthLevel });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex-shrink-0 transition-all duration-200 ${
        isBookmarked ? "text-accent" : "text-muted hover:text-accent"
      }`}
      title={isBookmarked ? "Remove from saved" : "Save package"}
    >
      <BookmarkIcon className="h-5 w-5" filled={isBookmarked} />
    </button>
  );
}

function BookmarkIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
