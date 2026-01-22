"use client";

import { useBookmarkStore, type BookmarkedPackage } from "@/stores";
import { HealthBadge } from "@/components";

interface BookmarksPanelProps {
  onSelectPackage: (name: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function BookmarksPanel({
  onSelectPackage,
  isVisible,
  onClose,
}: BookmarksPanelProps) {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const clearAll = useBookmarkStore((s) => s.clearAll);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-slide-in-right fixed inset-x-4 bottom-4 top-auto z-20 max-h-[80vh] overflow-hidden rounded-2xl border border-border/50 bg-bg/95 backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:top-auto sm:w-96 sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold sm:text-lg">
              Saved Packages
            </h2>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {bookmarks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-auto p-3 sm:p-4"
          style={{ maxHeight: "calc(80vh - 60px)" }}
        >
          {bookmarks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {bookmarks.map((pkg) => (
                <BookmarkCard
                  key={pkg.name}
                  pkg={pkg}
                  onSelect={() => {
                    onSelectPackage(pkg.name);
                    onClose();
                  }}
                  onRemove={() => removeBookmark(pkg.name)}
                />
              ))}
            </div>
          )}
        </div>

        {bookmarks.length > 0 && (
          <div className="border-t border-border/50 px-4 py-3 sm:px-5 sm:py-4">
            <button
              onClick={clearAll}
              className="w-full rounded-lg border border-critical/30 bg-critical/5 py-2 text-xs font-medium text-critical transition-colors hover:bg-critical/10 sm:text-sm"
            >
              Clear All Bookmarks
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BookmarkCard({
  pkg,
  onSelect,
  onRemove,
}: {
  pkg: BookmarkedPackage;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const timeAgo = getTimeAgo(pkg.bookmarkedAt);

  return (
    <div className="group relative rounded-xl bg-surface p-3 transition-colors hover:bg-surface/80 sm:p-4">
      <button
        onClick={onSelect}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="flex-shrink-0 pt-0.5">
          <HealthBadge
            score={pkg.healthScore}
            level={pkg.healthLevel}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">
            {pkg.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            v{pkg.version} · Saved {timeAgo}
          </p>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition-all hover:bg-bg hover:text-critical group-hover:opacity-100 sm:right-3 sm:top-3"
        title="Remove bookmark"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-8 text-center sm:py-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface sm:h-16 sm:w-16">
        <BookmarkIcon className="h-6 w-6 text-muted sm:h-8 sm:w-8" />
      </div>
      <p className="text-sm font-medium sm:text-base">No saved packages</p>
      <p className="mt-1 text-xs text-muted sm:text-sm">
        Save packages to quickly access them later
      </p>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
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
