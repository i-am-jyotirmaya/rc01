import { useCallback, useEffect, useMemo } from "react";

import {
  fetchBattleConfig,
  persistBattleConfig,
  resetBattleDraft,
  setActiveBattleConfigId,
  setBattleProblems,
  updateBattleDraft,
} from "../../../../features/battleConfig/battleConfigSlice";
import {
  selectBattleConfigDraft,
  selectBattleConfigHasLocalChanges,
  selectBattleConfigLoadError,
  selectBattleConfigLoading,
  selectBattleConfigPersistError,
  selectBattleConfigPersisting,
} from "../../../../features/battleConfig/selectors";
import type { BattleConfigDraft, BattleProblemSummary } from "../../../../features/battleConfig/types";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";

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
> & { status?: BattleConfigDraft["status"] };

export interface UseBattleConfigDraftResult {
  draft: BattleConfigDraft | null;
  isLoading: boolean;
  loadError: string | null;
  isPersisting: boolean;
  persistError: string | null;
  updateDraft: (input: DraftUpdate) => void;
  updateProblems: (nextProblems: BattleProblemSummary[]) => void;
  persistDraft: () => Promise<void>;
  publishDraft: () => Promise<void>;
  resetLocalChanges: () => void;
  hasLocalChanges: boolean;
}

export const useBattleConfigDraft = ({ battleId }: UseBattleConfigDraftArgs): UseBattleConfigDraftResult => {
  const dispatch = useAppDispatch();

  const draft = useAppSelector((state) => selectBattleConfigDraft(state, battleId));
  const isLoading = useAppSelector((state) => selectBattleConfigLoading(state, battleId));
  const loadError = useAppSelector((state) => selectBattleConfigLoadError(state, battleId));
  const isPersisting = useAppSelector((state) => selectBattleConfigPersisting(state, battleId));
  const persistError = useAppSelector((state) => selectBattleConfigPersistError(state, battleId));
  const hasLocalChanges = useAppSelector((state) => selectBattleConfigHasLocalChanges(state, battleId));

  useEffect(() => {
    dispatch(setActiveBattleConfigId(battleId));
  }, [battleId, dispatch]);

  useEffect(() => {
    if (!draft && !isLoading && !loadError) {
      void dispatch(fetchBattleConfig(battleId));
    }
  }, [battleId, dispatch, draft, isLoading, loadError]);

  const updateDraftState = useCallback(
    (input: DraftUpdate) => {
      dispatch(updateBattleDraft({ battleId, changes: input }));
    },
    [battleId, dispatch],
  );

  const updateProblems = useCallback(
    (nextProblems: BattleProblemSummary[]) => {
      dispatch(setBattleProblems({ battleId, problems: nextProblems }));
    },
    [battleId, dispatch],
  );

  const persistDraft = useCallback(async () => {
    await dispatch(persistBattleConfig(battleId)).unwrap();
  }, [battleId, dispatch]);

  const publishDraft = useCallback(async () => {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 250);
    });
  }, []);

  const resetLocalChanges = useCallback(() => {
    dispatch(resetBattleDraft(battleId));
  }, [battleId, dispatch]);

  const result: UseBattleConfigDraftResult = useMemo(
    () => ({
      draft,
      isLoading,
      loadError,
      isPersisting,
      persistError,
      updateDraft: updateDraftState,
      updateProblems,
      persistDraft,
      publishDraft,
      resetLocalChanges,
      hasLocalChanges,
    }),
    [
      draft,
      hasLocalChanges,
      isLoading,
      isPersisting,
      loadError,
      persistDraft,
      persistError,
      publishDraft,
      resetLocalChanges,
      updateDraftState,
      updateProblems,
    ],
  );

  return result;
};
