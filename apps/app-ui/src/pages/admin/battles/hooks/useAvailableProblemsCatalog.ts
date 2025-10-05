import { useCallback, useEffect, useState } from 'react';

import type { ProblemMetadata } from '@rc01/api-client';

import { problemApi } from '../../../../services/api';
import type { ProblemCatalogEntry } from '../types';

interface UseAvailableProblemsCatalogResult {
  problems: ProblemCatalogEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const toProblemCatalogEntry = (metadata: ProblemMetadata): ProblemCatalogEntry => ({
  id: metadata.slug,
  title: metadata.title,
  difficulty: metadata.difficulty,
  tags: metadata.tags ?? [],
  estimatedDurationMinutes: metadata.estimatedDurationMinutes,
  lastModifiedAt: metadata.updatedAt,
  author: metadata.author,
  source: metadata.source,
});

export const useAvailableProblemsCatalog = (): UseAvailableProblemsCatalogResult => {
  const [problems, setProblems] = useState<ProblemCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await problemApi.listProblems();
      setProblems(response.problems.map(toProblemCatalogEntry));
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
