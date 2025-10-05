import { useCallback, useEffect } from "react";

import type { ProblemMetadata } from "@rc01/api-client";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { fetchProblems } from "../../../../features/problems/problemsSlice";
import {
  selectProblems,
  selectProblemsError,
  selectProblemsStatus,
} from "../../../../features/problems/selectors";

interface UseAvailableProblemsCatalogResult {
  problems: ProblemMetadata[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAvailableProblemsCatalog = (): UseAvailableProblemsCatalogResult => {
  const dispatch = useAppDispatch();
  const problems = useAppSelector(selectProblems);
  const status = useAppSelector(selectProblemsStatus);
  const error = useAppSelector(selectProblemsError);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchProblems());
    }
  }, [status, dispatch]);

  const refresh = useCallback(async () => {
    try {
      await dispatch(fetchProblems()).unwrap();
    } catch {
      // The slice already tracks the error state.
    }
  }, [dispatch]);

  return {
    problems,
    isLoading: status === "loading",
    error,
    refresh,
  };
};
