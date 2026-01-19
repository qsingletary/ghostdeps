"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ThemeToggle,
  SearchInput,
  SearchResults,
  TreeStats,
  DependencyGraph,
  NodeDetail,
} from "@/components";
import { usePackageSearch, useDependencyTree, useTheme } from "@/hooks";
import { useUIStore } from "@/stores";

export default function HomePage() {
  const [showResults, setShowResults] = useState(false);
  const { theme } = useTheme();

  const {
    query,
    setQuery,
    results,
    isLoading: isSearching,
  } = usePackageSearch();
  const {
    tree,
    isLoading: isResolving,
    error,
    resolve,
    clear,
  } = useDependencyTree();

  const selectedNode = useUIStore((s) => s.selectedNode);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const handleSearch = (name: string) => {
    setShowResults(false);
    setSelectedNode(null);
    resolve(name);
  };

  return (
    <div className="flex h-screen flex-col bg-bg">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-gradient-radial opacity-50" />

      <header className="relative z-10 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Image
                  src="/logos/logo-dark.svg"
                  alt="GhostDeps Logo"
                  width={36}
                  height={36}
                  className="h-8 w-8 flex-shrink-0 transition-transform duration-200 hover:scale-110 sm:h-9 sm:w-9"
                />
              ) : (
                <Image
                  src="/logos/logo-light.svg"
                  alt="GhostDeps Logo"
                  width={36}
                  height={36}
                  className="h-8 w-8 flex-shrink-0 transition-transform duration-200 hover:scale-110 sm:h-9 sm:w-9"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                  GhostDeps
                </h1>
                <p className="hidden text-xs text-muted sm:block">
                  Dependency Health Scanner
                </p>
              </div>
            </div>

            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-80">
              <SearchInput
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setShowResults(true);
                }}
                onSubmit={handleSearch}
                isLoading={isSearching}
                placeholder="Search npm packages..."
              />
              <SearchResults
                results={results}
                onSelect={(name) => {
                  setQuery(name);
                  handleSearch(name);
                }}
                visible={showResults && query.length >= 2}
              />
            </div>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {!tree && !isResolving && !error && <EmptyState />}

          {isResolving && <LoadingState />}

          {error && <ErrorState message={error} onClear={clear} />}

          {tree && !isResolving && (
            <div className="animate-fade-in flex flex-col">
              <div className="border-b border-border/50 bg-surface/50 px-4 py-3 sm:px-6 sm:py-4">
                <TreeStats stats={tree.stats} />
              </div>
              <DependencyGraph
                root={tree.root}
                onSelectNode={setSelectedNode}
                selectedId={selectedNode?.id ?? null}
              />
            </div>
          )}
        </div>

        <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-4 sm:px-6">
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 sm:h-24 sm:w-24">
          <svg
            className="h-10 w-10 text-accent sm:h-12 sm:w-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9v11l2-2 2 2 2-2 2 2 2-2 2 2 2-2V9c0-3.87-3.13-7-7-7z" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Search for a package
        </h2>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Enter an npm package name to visualize its dependency tree
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted sm:px-4 sm:py-2 sm:text-sm">
            Try: react, lodash, express
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center px-4 sm:px-6">
      <div className="animate-fade-in text-center">
        <div className="relative mx-auto mb-6 h-16 w-16 sm:h-20 sm:w-20">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
          <div className="absolute inset-3 animate-pulse rounded-full bg-accent/20" />
        </div>
        <h2 className="text-lg font-semibold sm:text-xl">
          Resolving dependencies
        </h2>
        <p className="mt-2 text-xs text-muted sm:text-sm">
          Analyzing package health and building the tree...
        </p>
        <div className="mt-4 flex justify-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onClear,
}: {
  message: string;
  onClear: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center px-4 sm:px-6">
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-critical/10 sm:h-20 sm:w-20">
          <svg
            className="h-8 w-8 text-critical sm:h-10 sm:w-10"
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
        </div>
        <h2 className="text-lg font-semibold text-critical sm:text-xl">
          Something went wrong
        </h2>
        <p className="mt-2 max-w-md text-xs text-muted sm:text-sm">{message}</p>
        <button onClick={onClear} className="btn-secondary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
