import { useCallback, useEffect, useMemo, useState } from "react";

import type { BattleConfigDraft } from "../types";
import type { BattleConfigStatus, BattleProblemSummary } from "../types";

interface UseBattleConfigDraftArgs {
  battleId: string;
}

interface DraftUpdate {
  name?: string;
  shortDescription?: string;
  status?: BattleConfigStatus;
  startMode?: BattleConfigDraft["startMode"];
  scheduledStartAt?: BattleConfigDraft["scheduledStartAt"];
  allowSpectators?: boolean;
  voiceChat?: boolean;
  teamBalancing?: boolean;
  primaryLanguagePool?: string[];
  notes?: string;
}

export interface UseBattleConfigDraftResult {
  draft: BattleConfigDraft | null;
  isLoading: boolean;
  loadError: Error | null;
  updateDraft: (input: DraftUpdate) => void;
  updateProblems: (nextProblems: BattleProblemSummary[]) => void;
  persistDraft: () => Promise<void>;
  publishDraft: () => Promise<void>;
  resetLocalChanges: () => void;
  hasLocalChanges: boolean;
}

const initialStub: BattleConfigDraft = {
  battleId: "",
  name: "",
  status: "draft",
  shortDescription: "",
  startMode: "manual",
  scheduledStartAt: null,
  allowSpectators: true,
  voiceChat: false,
  teamBalancing: true,
  problems: [],
  primaryLanguagePool: ["typescript"],
  notes: undefined,
};

export const useBattleConfigDraft = ({ battleId }: UseBattleConfigDraftArgs): UseBattleConfigDraftResult => {
  const [draft, setDraft] = useState<BattleConfigDraft | null>(null);
  const [original, setOriginal] = useState<BattleConfigDraft | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    // TODO: Replace with real API request once SV-001 is complete.
    const bootstrap = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const simulatedResponse: BattleConfigDraft = {
          ...initialStub,
          battleId,
          name: "CodeBattle Spring Invitational",
          status: "configuring",
          shortDescription:
            "Stage the invitational bracket, confirm participants, and lock in curated problem sets before kickoff.",
          startMode: "scheduled",
          scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          problems: [
            {
              id: "sample-problem-1",
              title: "Graph Path Routing",
              difficulty: "medium",
              estimatedDurationMinutes: 30,
              tags: ["graphs", "pathfinding"],
            },
          ],
          primaryLanguagePool: ["typescript", "python", "rust"],
          notes: "Confirm streaming overlays before publishing battle lobby.",
        };

        if (!isMounted) {
          return;
        }

        setDraft(simulatedResponse);
        setOriginal(simulatedResponse);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLoadError(error as Error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [battleId]);

  const updateDraft = useCallback((input: DraftUpdate) => {
    setDraft((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        ...input,
      };
    });
  }, []);

  const updateProblems = useCallback((nextProblems: BattleProblemSummary[]) => {
    setDraft((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        problems: nextProblems,
      };
    });
  }, []);

  const persistDraft = useCallback(async () => {
    // TODO: Replace simulated delay with battle configuration PATCH request.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 250);
    });
  }, []);

  const publishDraft = useCallback(async () => {
    // TODO: Replace with battle publish endpoint once available.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 250);
    });
  }, []);

  const resetLocalChanges = useCallback(() => {
    setDraft(original);
  }, [original]);

  const hasLocalChanges = useMemo(() => {
    if (!draft || !original) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(original);
  }, [draft, original]);

  return {
    draft,
    isLoading,
    loadError,
    updateDraft,
    updateProblems,
    persistDraft,
    publishDraft,
    resetLocalChanges,
    hasLocalChanges,
  };
};
