import type { RootState } from "../../store/store";
import type { BattleConfigDraft } from "./types";

export const selectBattleConfigState = (state: RootState) => state.battleConfig;

export const selectBattleConfigEntry = (state: RootState, battleId: string) =>
  state.battleConfig.entries[battleId];

export const selectActiveBattleConfigId = (state: RootState) => state.battleConfig.activeBattleId;

export const selectBattleConfigDraft = (state: RootState, battleId: string): BattleConfigDraft | null => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.draft ?? null;
};

export const selectBattleConfigLoading = (state: RootState, battleId: string): boolean => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.isLoading ?? false;
};

export const selectBattleConfigPersisting = (state: RootState, battleId: string): boolean => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.isPersisting ?? false;
};

export const selectBattleConfigLoadError = (state: RootState, battleId: string): string | null => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.loadError ?? null;
};

export const selectBattleConfigPersistError = (state: RootState, battleId: string): string | null => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.persistError ?? null;
};

export const selectBattleConfigHasLocalChanges = (state: RootState, battleId: string): boolean => {
  const entry = selectBattleConfigEntry(state, battleId);
  return entry?.hasLocalChanges ?? false;
};
