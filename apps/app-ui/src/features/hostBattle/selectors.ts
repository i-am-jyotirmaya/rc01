import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../store/store";
import type { HostBattleState } from "./hostBattleSlice";

export const selectHostBattleState = (state: RootState): HostBattleState => state.hostBattle;

export const selectBattles = createSelector(selectHostBattleState, (state) => state.battles);

export const selectHostBattleLoading = createSelector(selectHostBattleState, (state) => state.loading);

export const selectShowAdvancedOptions = createSelector(
  selectHostBattleState,
  (state) => state.showAdvancedOptions,
);

export const selectDrawerAdvancedOptions = createSelector(
  selectHostBattleState,
  (state) => state.drawerAdvancedOptions,
);

export const selectDrawerOpen = createSelector(selectHostBattleState, (state) => state.isDrawerOpen);

export const selectSelectedBattleId = createSelector(
  selectHostBattleState,
  (state) => state.selectedBattleId,
);

export const selectSelectedBattle = createSelector(
  [selectBattles, selectSelectedBattleId],
  (battles, selectedId) => battles.find((battle) => battle.id === selectedId) ?? null,
);

export const selectCreatePending = createSelector(selectHostBattleState, (state) => state.isCreating);

export const selectUpdatePending = createSelector(selectHostBattleState, (state) => state.isUpdating);

export const selectStartingBattleId = createSelector(
  selectHostBattleState,
  (state) => state.startingBattleId,
);

export const selectHostBattleError = createSelector(selectHostBattleState, (state) => state.error);
