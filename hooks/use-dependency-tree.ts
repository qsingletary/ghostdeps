"use client";

import { useState, useCallback } from "react";
import type { DependencyTree } from "@/modules/packages";

interface UseDependencyTreeReturn {
  tree: DependencyTree | null;
  isLoading: boolean;
  error: string | null;
  resolve: (name: string, version?: string, maxDepth?: number) => Promise<void>;
  clear: () => void;
}

export function useDependencyTree(): UseDependencyTreeReturn {
  const [tree, setTree] = useState<DependencyTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(
    async (name: string, version = "latest", maxDepth = 5) => {
      setIsLoading(true);
      setError(null);
      setTree(null);

      try {
        const params = new URLSearchParams({
          version,
          maxDepth: String(maxDepth),
        });

        const res = await fetch(
          `/api/resolve/${encodeURIComponent(name)}?${params}`,
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to resolve");
        }

        setTree(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setTree(null);
    setError(null);
  }, []);

  return { tree, isLoading, error, resolve, clear };
}
