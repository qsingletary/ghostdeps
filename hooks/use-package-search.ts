"use client";

import { useState, useEffect } from "react";
import type { PackageSearchResult } from "@/modules/packages";

interface UsePackageSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: PackageSearchResult[];
  isLoading: boolean;
}

export function usePackageSearch(debounceMs = 250): UsePackageSearchReturn {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<PackageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
          {
            signal: controller.signal,
          },
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("Search failed:", e);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  return { query, setQuery, results, isLoading };
}
