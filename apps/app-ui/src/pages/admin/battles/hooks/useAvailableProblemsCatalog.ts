import { useCallback, useEffect, useState } from 'react';

import { listProblems, type FileManagerProblemMetadata } from '../api/problemManagerClient';
import type { ProblemCatalogEntry } from '../types';

interface UseAvailableProblemsCatalogResult {
  problems: ProblemCatalogEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const toProblemCatalogEntry = (metadata: FileManagerProblemMetadata): ProblemCatalogEntry => ({
  id: metadata.slug,
  title: metadata.title,
  difficulty: metadata.difficulty,
  tags: metadata.tags ?? [],
  estimatedDurationMinutes: metadata.estimatedDurationMinutes,
  lastModifiedAt: metadata.updatedAt,
  author: metadata.author,
});

export const useAvailableProblemsCatalog = (): UseAvailableProblemsCatalogResult => {
  const [problems, setProblems] = useState<ProblemCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const catalog = await listProblems();
      setProblems(catalog.map(toProblemCatalogEntry));
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
