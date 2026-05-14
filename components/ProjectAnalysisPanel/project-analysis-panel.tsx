"use client";

import { useMemo } from "react";
import {
  useProjectAnalysisStore,
  getFilteredPackages,
} from "@/stores/project-analysis-store";
import FileDropZone from "./file-drop-zone";
import PackageList from "./package-list";
import ProjectSummary from "./project-summary";
import FilterControls from "./filter-controls";

interface ProjectAnalysisPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPackage: (name: string) => void;
}

export default function ProjectAnalysisPanel({
  isVisible,
  onClose,
  onSelectPackage,
}: ProjectAnalysisPanelProps) {
  const analysis = useProjectAnalysisStore((s) => s.analysis);
  const isLoading = useProjectAnalysisStore((s) => s.isLoading);
  const error = useProjectAnalysisStore((s) => s.error);
  const analyze = useProjectAnalysisStore((s) => s.analyze);
  const clear = useProjectAnalysisStore((s) => s.clear);
  const sortBy = useProjectAnalysisStore((s) => s.sortBy);
  const filterBy = useProjectAnalysisStore((s) => s.filterBy);

  const packages = useMemo(
    () => getFilteredPackages(analysis, sortBy, filterBy),
    [analysis, sortBy, filterBy],
  );

  if (!isVisible) return null;

  const handleSelectPackage = (name: string) => {
    onSelectPackage(name);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-slide-in-right fixed inset-x-4 bottom-4 top-auto z-20 max-h-[85vh] overflow-hidden rounded-2xl border border-border/50 bg-bg/95 backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:top-auto sm:w-[480px] sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold sm:text-lg">
              Project Analysis
            </h2>
            {analysis && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {packages.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-auto p-4 sm:p-5"
          style={{ maxHeight: "calc(85vh - 140px)" }}
        >
          {!analysis && !error && (
            <FileDropZone onFileContent={analyze} isLoading={isLoading} />
          )}

          {error && (
            <div className="space-y-3">
              <div className="rounded-xl bg-critical/10 p-4 text-center">
                <ErrorIcon className="mx-auto mb-2 h-8 w-8 text-critical" />
                <p className="text-sm font-medium text-critical">
                  Analysis failed
                </p>
                <p className="mt-1 text-xs text-muted">{error}</p>
              </div>
              <button
                onClick={clear}
                className="w-full rounded-lg bg-surface py-2 text-sm font-medium transition-colors hover:bg-surface/80"
              >
                Try again
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {analysis.projectName && (
                <div className="rounded-lg bg-surface px-3 py-2">
                  <p className="text-xs text-muted">Project</p>
                  <p className="font-medium">
                    {analysis.projectName}
                    {analysis.projectVersion && (
                      <span className="ml-2 text-xs text-muted">
                        v{analysis.projectVersion}
                      </span>
                    )}
                  </p>
                </div>
              )}

              <ProjectSummary />
              <FilterControls />
              <PackageList
                packages={packages}
                onSelectPackage={handleSelectPackage}
              />
            </div>
          )}
        </div>

        {analysis && (
          <div className="border-t border-border/50 px-4 py-3 sm:px-5 sm:py-4">
            <button
              onClick={clear}
              className="w-full rounded-lg border border-critical/30 bg-critical/5 py-2 text-xs font-medium text-critical transition-colors hover:bg-critical/10 sm:text-sm"
            >
              Clear Analysis
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function FolderIcon({ className }: { className?: string }) {
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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

function ErrorIcon({ className }: { className?: string }) {
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
