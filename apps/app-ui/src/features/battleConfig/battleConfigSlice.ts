import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BattleRecord } from "@rc01/api-client";

import { battleApi } from "../../services/api";
import type { RootState } from "../../store/store";
import { upsertBattleRecord } from "../hostBattle/hostBattleSlice";
import type { BattleConfigDraft, BattleProblemSummary } from "./types";
import {
  buildConfigurationPayload,
  cloneDraft,
  computeHasLocalChanges,
  createInitialDraft,
  mapBattleToDraft,
} from "./utils";

interface BattleConfigEntry {
  draft: BattleConfigDraft | null;
  original: BattleConfigDraft | null;
  isLoading: boolean;
  loadError: string | null;
  isPersisting: boolean;
  persistError: string | null;
  hasLocalChanges: boolean;
}

interface BattleConfigState {
  entries: Record<string, BattleConfigEntry>;
  activeBattleId: string | null;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const createEmptyEntry = (): BattleConfigEntry => ({
  draft: null,
  original: null,
  isLoading: false,
  loadError: null,
  isPersisting: false,
  persistError: null,
  hasLocalChanges: false,
});

const ensureEntry = (state: BattleConfigState, battleId: string): BattleConfigEntry => {
  if (!state.entries[battleId]) {
    state.entries[battleId] = createEmptyEntry();
  }

  return state.entries[battleId];
};

const deriveHasChanges = (entry: BattleConfigEntry) => {
  entry.hasLocalChanges = computeHasLocalChanges(entry.draft, entry.original);
};

const initialState: BattleConfigState = {
  entries: {},
  activeBattleId: null,
};

export const fetchBattleConfig = createAsyncThunk<
  { battleId: string; battle: BattleRecord; draft: BattleConfigDraft },
  string,
  { rejectValue: string }
>("battleConfig/fetchBattleConfig", async (battleId, { rejectWithValue, dispatch }) => {
  try {
    const response = await battleApi.getBattle(battleId);
    const mappedDraft = mapBattleToDraft(response.battle);

    dispatch(upsertBattleRecord(response.battle));

    return { battleId, battle: response.battle, draft: mappedDraft };
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, "Unable to load battle configuration."));
  }
});

export const persistBattleConfig = createAsyncThunk<
  { battleId: string; battle: BattleRecord; draft: BattleConfigDraft },
  string,
  { rejectValue: string; state: RootState }
>("battleConfig/persistBattleConfig", async (battleId, { rejectWithValue, getState, dispatch }) => {
  const entry = getState().battleConfig.entries[battleId];

  if (!entry || !entry.draft) {
    return rejectWithValue("Battle configuration is not loaded yet.");
  }

  try {
    const draft = entry.draft;
    const scheduledStart = draft.startMode === "scheduled" ? draft.scheduledStartAt ?? null : null;

    const response = await battleApi.updateBattle(draft.battleId, {
      name: draft.name,
      shortDescription: draft.shortDescription ? draft.shortDescription : null,
      configuration: buildConfigurationPayload(draft),
      startMode: draft.startMode,
      scheduledStartAt: scheduledStart,
    });

    const mappedDraft = mapBattleToDraft(response.battle);

    dispatch(upsertBattleRecord(response.battle));

    return { battleId, battle: response.battle, draft: mappedDraft };
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, "Failed to save battle configuration."));
  }
});

const battleConfigSlice = createSlice({
  name: "battleConfig",
  initialState,
  reducers: {
    setActiveBattleConfigId(state, action: PayloadAction<string | null>) {
      state.activeBattleId = action.payload;

      if (action.payload) {
        ensureEntry(state, action.payload);
      }
    },
    updateBattleDraft(state, action: PayloadAction<{ battleId: string; changes: Partial<BattleConfigDraft> }>) {
      const { battleId, changes } = action.payload;
      const entry = ensureEntry(state, battleId);

      if (!entry.draft) {
        const initialDraft = createInitialDraft(battleId);
        entry.draft = { ...initialDraft, ...changes };
        entry.original = entry.original ?? cloneDraft(initialDraft);
      } else {
        entry.draft = { ...entry.draft, ...changes };
      }

      deriveHasChanges(entry);
      entry.persistError = null;
    },
    setBattleProblems(state, action: PayloadAction<{ battleId: string; problems: BattleProblemSummary[] }>) {
      const { battleId, problems } = action.payload;
      const entry = ensureEntry(state, battleId);

      if (!entry.draft) {
        const initialDraft = createInitialDraft(battleId);
        entry.draft = { ...initialDraft, problems: problems.slice() };
        entry.original = entry.original ?? cloneDraft(initialDraft);
      } else {
        entry.draft = { ...entry.draft, problems: problems.slice() };
      }

      deriveHasChanges(entry);
      entry.persistError = null;
    },
    resetBattleDraft(state, action: PayloadAction<string>) {
      const battleId = action.payload;
      const entry = ensureEntry(state, battleId);

      if (!entry.original) {
        return;
      }

      entry.draft = cloneDraft(entry.original);
      entry.persistError = null;
      deriveHasChanges(entry);
    },
    clearBattlePersistError(state, action: PayloadAction<string>) {
      const battleId = action.payload;
      const entry = state.entries[battleId];

      if (!entry) {
        return;
      }

      entry.persistError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBattleConfig.pending, (state, action) => {
        const battleId = action.meta.arg;
        const entry = ensureEntry(state, battleId);
        entry.isLoading = true;
        entry.loadError = null;
      })
      .addCase(fetchBattleConfig.fulfilled, (state, action) => {
        const { battleId, draft } = action.payload;
        const entry = ensureEntry(state, battleId);
        entry.isLoading = false;
        entry.loadError = null;
        entry.draft = cloneDraft(draft);
        entry.original = cloneDraft(draft);
        deriveHasChanges(entry);
      })
      .addCase(fetchBattleConfig.rejected, (state, action) => {
        const battleId = action.meta.arg;
        const entry = ensureEntry(state, battleId);
        entry.isLoading = false;
        entry.loadError = action.payload ?? action.error.message ?? "Unable to load battle configuration.";
      })
      .addCase(persistBattleConfig.pending, (state, action) => {
        const battleId = action.meta.arg;
        const entry = ensureEntry(state, battleId);

        entry.isPersisting = true;
        entry.persistError = null;
      })
      .addCase(persistBattleConfig.fulfilled, (state, action) => {
        const { battleId, draft } = action.payload;
        const entry = ensureEntry(state, battleId);

        entry.isPersisting = false;
        entry.persistError = null;
        entry.draft = cloneDraft(draft);
        entry.original = cloneDraft(draft);
        deriveHasChanges(entry);
      })
      .addCase(persistBattleConfig.rejected, (state, action) => {
        const battleId = action.meta.arg;
        const entry = ensureEntry(state, battleId);

        entry.isPersisting = false;
        entry.persistError = action.payload ?? action.error.message ?? "Failed to save battle configuration.";
      });
  },
});

export const {
  setActiveBattleConfigId,
  updateBattleDraft,
  setBattleProblems,
  resetBattleDraft,
  clearBattlePersistError,
} = battleConfigSlice.actions;

export const battleConfigReducer = battleConfigSlice.reducer;
