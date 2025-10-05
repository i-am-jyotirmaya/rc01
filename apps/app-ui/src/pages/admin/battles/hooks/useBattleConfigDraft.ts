import { useCallback, useEffect, useMemo, useState } from "react";

import type { BattleRecord } from "@rc01/api-client";

import { battleApi } from "../../../../services/api";
import type { BattleConfigDraft } from "../types";
import type { BattleConfigStatus, BattleProblemSummary } from "../types";

interface UseBattleConfigDraftArgs {
  battleId: string;
}

type DraftUpdate = Partial<
  Pick<
    BattleConfigDraft,
    |
      "name"
      | "shortDescription"
      | "gameMode"
      | "difficulty"
      | "maxPlayers"
      | "privacy"
      | "startMode"
      | "scheduledStartAt"
      | "allowSpectators"
      | "voiceChat"
      | "teamBalancing"
      | "primaryLanguagePool"
      | "notes"
      | "turnTimeLimit"
      | "totalDuration"
      | "scoringRules"
      | "tieBreakPreference"
      | "powerUps"
      | "ratingFloor"
      | "ratingCeiling"
      | "moderatorRoles"
      | "preloadedResources"
      | "rematchDefaults"
      | "joinQueueSize"
      | "password"
      | "linkExpiry"
  >
> & { status?: BattleConfigStatus };

export interface UseBattleConfigDraftResult {
  draft: BattleConfigDraft | null;
  isLoading: boolean;
  loadError: Error | null;
  isPersisting: boolean;
  persistError: Error | null;
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
  gameMode: undefined,
  difficulty: undefined,
  maxPlayers: null,
  privacy: "public",
  startMode: "manual",
  scheduledStartAt: null,
  allowSpectators: true,
  voiceChat: false,
  teamBalancing: true,
  problems: [],
  primaryLanguagePool: ["typescript"],
  notes: undefined,
  turnTimeLimit: null,
  totalDuration: null,
  scoringRules: undefined,
  tieBreakPreference: undefined,
  powerUps: [],
  ratingFloor: null,
  ratingCeiling: null,
  moderatorRoles: [],
  preloadedResources: undefined,
  rematchDefaults: false,
  joinQueueSize: null,
  password: undefined,
  linkExpiry: undefined,
};

const mapBattleToDraft = (battle: BattleRecord): BattleConfigDraft => {
  const configuration = (battle.configuration ?? {}) as Partial<BattleConfigDraft>;
  const problems = Array.isArray(configuration.problems)
    ? (configuration.problems as BattleProblemSummary[])
    : [];

  return {
    ...initialStub,
    ...configuration,
    battleId: battle.id,
    name: battle.name,
    status: (battle.status as BattleConfigStatus) ?? "draft",
    shortDescription: battle.shortDescription ?? "",
    startMode: battle.autoStart ? "scheduled" : "manual",
    scheduledStartAt: battle.scheduledStartAt,
    problems,
  };
};

const buildConfigurationPayload = (draft: BattleConfigDraft): Record<string, unknown> => ({
  gameMode: draft.gameMode,
  difficulty: draft.difficulty,
  maxPlayers: draft.maxPlayers,
  privacy: draft.privacy,
  allowSpectators: draft.allowSpectators,
  voiceChat: draft.voiceChat,
  teamBalancing: draft.teamBalancing,
  problems: draft.problems,
  primaryLanguagePool: draft.primaryLanguagePool,
  notes: draft.notes,
  turnTimeLimit: draft.turnTimeLimit,
  totalDuration: draft.totalDuration,
  scoringRules: draft.scoringRules,
  tieBreakPreference: draft.tieBreakPreference,
  powerUps: draft.powerUps,
  ratingFloor: draft.ratingFloor,
  ratingCeiling: draft.ratingCeiling,
  moderatorRoles: draft.moderatorRoles,
  preloadedResources: draft.preloadedResources,
  rematchDefaults: draft.rematchDefaults,
  joinQueueSize: draft.joinQueueSize,
  password: draft.password,
  linkExpiry: draft.linkExpiry,
});

export const useBattleConfigDraft = ({ battleId }: UseBattleConfigDraftArgs): UseBattleConfigDraftResult => {
  const [draft, setDraft] = useState<BattleConfigDraft | null>(null);
  const [original, setOriginal] = useState<BattleConfigDraft | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isPersisting, setIsPersisting] = useState<boolean>(false);
  const [persistError, setPersistError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      setLoadError(null);
      setPersistError(null);

      try {
        console.log("Fetching battle response", battleApi)
        const response = await battleApi.getBattle(battleId);
        if (!isMounted) {
          return;
        }

        const mappedDraft = mapBattleToDraft(response.battle);
        setDraft(mappedDraft);
        setOriginal(mappedDraft);
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

    bootstrap();

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
    if (!draft) {
      return;
    }

    setPersistError(null);
    setIsPersisting(true);

    try {
      const scheduledStart =
        draft.startMode === "scheduled" ? draft.scheduledStartAt ?? null : null;

      const response = await battleApi.updateBattle(draft.battleId, {
        name: draft.name,
        shortDescription: draft.shortDescription,
        configuration: buildConfigurationPayload(draft),
        startMode: draft.startMode,
        scheduledStartAt: scheduledStart,
      });

      const mappedDraft = mapBattleToDraft(response.battle);
      setDraft(mappedDraft);
      setOriginal(mappedDraft);
    } catch (error) {
      setPersistError(error as Error);
      throw error;
    } finally {
      setIsPersisting(false);
    }
  }, [draft]);

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
    isPersisting,
    persistError,
    updateDraft,
    updateProblems,
    persistDraft,
    publishDraft,
    resetLocalChanges,
    hasLocalChanges,
  };
};
