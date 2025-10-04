import { useCallback, useEffect, useState } from "react";

import type { ProblemCatalogEntry } from "../types";

interface UseAvailableProblemsCatalogResult {
  problems: ProblemCatalogEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const stubProblems: ProblemCatalogEntry[] = [
  {
    id: "sample-problem-1",
    title: "Graph Path Routing",
    difficulty: "medium",
    estimatedDurationMinutes: 30,
    tags: ["graphs", "pathfinding"],
    lastModifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    author: "Arena Admin",
  },
  {
    id: "sample-problem-2",
    title: "Distributed Log Analyzer",
    difficulty: "hard",
    estimatedDurationMinutes: 45,
    tags: ["distributed-systems", "streaming"],
    lastModifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    author: "Ops Team",
  },
  {
    id: "sample-problem-3",
    title: "Array Balancing Act",
    difficulty: "easy",
    estimatedDurationMinutes: 20,
    tags: ["arrays"],
    lastModifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    author: "Puzzle Guild",
  },
];

export const useAvailableProblemsCatalog = (): UseAvailableProblemsCatalogResult => {
  const [problems, setProblems] = useState<ProblemCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with file-manager catalog lookup once SV-001 lands.
      await new Promise((resolve) => {
        window.setTimeout(resolve, 200);
      });
      setProblems(stubProblems);
    } catch (refreshError) {
      setError(refreshError as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    problems,
    isLoading,
    error,
    refresh,
  };
};
