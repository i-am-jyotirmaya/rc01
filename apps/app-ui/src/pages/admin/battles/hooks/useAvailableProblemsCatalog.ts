import { useCallback, useEffect, useState } from "react";

import type { ProblemCatalogEntry } from "../types";

interface UseAvailableProblemsCatalogResult {
  problems: ProblemCatalogEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

interface FileManagerProblemMetadata {
  slug: string;
  filename: string;
  updatedAt: string;
  hash: string;
}

type CatalogDifficulty = ProblemCatalogEntry["difficulty"];

const fileManagerBaseUrl = (import.meta.env?.VITE_FILE_MANAGER_BASE_URL as string | undefined)?.trim();
const fileManagerAdminToken = (import.meta.env?.VITE_FILE_MANAGER_ADMIN_TOKEN as string | undefined)?.trim();

const normalizeBaseUrl = (baseUrl?: string): string => {
  if (!baseUrl) {
    throw new Error("File manager base URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
};

const requireAdminToken = (token?: string): string => {
  if (!token) {
    throw new Error("File manager admin token is not configured.");
  }

  return token;
};

const inferDifficultyFromSlug = (slug: string): CatalogDifficulty => {
  const difficultyPattern = /(?:^|[-_])(easy|medium|hard|insane)(?:$|[-_])/i;
  const match = difficultyPattern.exec(slug);
  if (match?.[1]) {
    return match[1].toLowerCase() as CatalogDifficulty;
  }

  return "medium";
};

const deriveTitleFromSlug = (slug: string, fallback: string): string => {
  const withoutDifficulty = slug.replace(/[-_](easy|medium|hard|insane)$/i, "");
  const spaced = withoutDifficulty.replace(/[-_]+/g, " ").trim();

  if (!spaced) {
    return fallback;
  }

  return spaced
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const toProblemCatalogEntry = (metadata: FileManagerProblemMetadata): ProblemCatalogEntry => {
  const baseTitle = metadata.filename.replace(/\.md$/i, "");
  const title = deriveTitleFromSlug(metadata.slug, baseTitle);

  return {
    id: metadata.slug,
    title,
    difficulty: inferDifficultyFromSlug(metadata.slug),
    tags: [],
    lastModifiedAt: metadata.updatedAt,
  } satisfies ProblemCatalogEntry;
};

const fetchProblemCatalog = async (): Promise<ProblemCatalogEntry[]> => {
  const baseUrl = normalizeBaseUrl(fileManagerBaseUrl);
  const adminToken = requireAdminToken(fileManagerAdminToken);

  const response = await fetch(`${baseUrl}/problems`, {
    headers: {
      Accept: "application/json",
      "x-admin-token": adminToken,
    },
  });

  if (!response.ok) {
    const message = response.status === 401 ? "File manager admin token rejected." : "Failed to load problem catalog.";
    throw new Error(message);
  }

  const payload = (await response.json()) as { problems?: FileManagerProblemMetadata[] };
  const problems = payload.problems ?? [];

  return problems.map(toProblemCatalogEntry);
};

export const useAvailableProblemsCatalog = (): UseAvailableProblemsCatalogResult => {
  const [problems, setProblems] = useState<ProblemCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const catalog = await fetchProblemCatalog();
      setProblems(catalog);
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
