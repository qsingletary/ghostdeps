"use client";

import { useState, useCallback, useRef } from "react";

interface FileDropZoneProps {
  onFileContent: (content: string) => void;
  isLoading: boolean;
}

export default function FileDropZone({
  onFileContent,
  isLoading,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.name !== "package.json") {
        setError("Please drop a package.json file");
        return;
      }

      try {
        const content = await file.text();
        onFileContent(content);
      } catch {
        setError("Failed to read file");
      }
    },
    [onFileContent],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (text) {
        setError(null);
        onFileContent(text);
      }
    },
    [onFileContent],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={handleClick}
        tabIndex={0}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all
          focus:outline-none focus:ring-2 focus:ring-accent/50
          ${
            isDragging
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 hover:bg-surface/50"
          }
          ${isLoading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <UploadIcon className="h-6 w-6 text-accent" />
          )}
        </div>

        <p className="text-sm font-medium">
          {isLoading ? "Analyzing..." : "Drop package.json here"}
        </p>
        <p className="mt-1 text-xs text-muted">
          or click to browse, or paste JSON content
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-critical/10 px-3 py-2 text-xs text-critical">
          {error}
        </div>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
