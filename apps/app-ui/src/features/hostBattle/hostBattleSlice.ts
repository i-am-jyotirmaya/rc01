import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BattleRecord } from "@rc01/api-client";
import { battleApi } from "../../services/api";
import type { RootState } from "../../store/store";
import type { HostBattleFormValues } from "./types";
import {
  buildBattlePayload,
  createErrorMessage,
  extractBattle,
  extractBattles,
  isConfigurableStatus,
} from "./utils";

export interface HostBattleState {
  battles: BattleRecord[];
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  startingBattleId: string | null;
  selectedBattleId: string | null;
  isDrawerOpen: boolean;
  showAdvancedOptions: boolean;
  drawerAdvancedOptions: boolean;
}

const initialState: HostBattleState = {
  battles: [],
  loading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  startingBattleId: null,
  selectedBattleId: null,
  isDrawerOpen: false,
  showAdvancedOptions: false,
  drawerAdvancedOptions: false,
};

export const fetchBattles = createAsyncThunk<BattleRecord[], void, { rejectValue: string }>(
  "hostBattle/fetchBattles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await battleApi.listBattles();
      return extractBattles(response);
    } catch (error) {
      return rejectWithValue(createErrorMessage(error, "Unable to load battles."));
    }
  },
);

export const createBattle = createAsyncThunk<BattleRecord, HostBattleFormValues, { rejectValue: string }>(
  "hostBattle/createBattle",
  async (values, { rejectWithValue }) => {
    try {
      const { create } = buildBattlePayload(values);
      const response = await battleApi.createBattle(create);
      const createdBattle = extractBattle(response);

      if (!createdBattle) {
        throw new Error("Battle creation response did not include the created battle.");
      }

      return createdBattle;
    } catch (error) {
      return rejectWithValue(createErrorMessage(error, "Failed to create battle."));
    }
  },
);

export const updateBattle = createAsyncThunk<
  BattleRecord,
  { battleId: string; values: HostBattleFormValues },
  { rejectValue: string; state: RootState }
>("hostBattle/updateBattle", async ({ battleId, values }, { rejectWithValue, getState }) => {
  try {
    const { update } = buildBattlePayload(values);
    const response = await battleApi.updateBattle(battleId, update);
    const updatedBattle = extractBattle(response);

    if (updatedBattle) {
      return updatedBattle;
    }

    const existing = getState().hostBattle.battles.find((battle) => battle.id === battleId);
    if (!existing) {
      throw new Error("Battle not found after update.");
    }

    return existing;
  } catch (error) {
    return rejectWithValue(createErrorMessage(error, "Failed to update battle."));
  }
});

export const startBattle = createAsyncThunk<BattleRecord, string, { rejectValue: string; state: RootState }>(
  "hostBattle/startBattle",
  async (battleId, { rejectWithValue, getState }) => {
    try {
      const response = await battleApi.startBattle(battleId);
      const startedBattle = extractBattle(response);

      if (startedBattle) {
        return startedBattle;
      }

      const existing = getState().hostBattle.battles.find((battle) => battle.id === battleId);
      if (!existing) {
        throw new Error("Battle not found after start.");
      }

      return existing;
    } catch (error) {
      return rejectWithValue(createErrorMessage(error, "Failed to start battle."));
    }
  },
);

const replaceBattle = (battles: BattleRecord[], next: BattleRecord) =>
  battles.map((battle) => (battle.id === next.id ? next : battle));

const upsertBattle = (battles: BattleRecord[], next: BattleRecord) => {
  const hasBattle = battles.some((battle) => battle.id === next.id);
  return hasBattle ? replaceBattle(battles, next) : [next, ...battles];
};

const hostBattleSlice = createSlice({
  name: "hostBattle",
  initialState,
  reducers: {
    upsertBattleRecord(state, action: PayloadAction<BattleRecord>) {
      state.battles = upsertBattle(state.battles, action.payload);
    },
    setShowAdvancedOptions(state, action: PayloadAction<boolean>) {
      state.showAdvancedOptions = action.payload;
    },
    setDrawerAdvancedOptions(state, action: PayloadAction<boolean>) {
      state.drawerAdvancedOptions = action.payload;
    },
    openDrawer(state, action: PayloadAction<string>) {
      state.selectedBattleId = action.payload;
      state.isDrawerOpen = true;
      state.drawerAdvancedOptions = false;
    },
    closeDrawer(state) {
      state.isDrawerOpen = false;
      state.selectedBattleId = null;
      state.drawerAdvancedOptions = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBattles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBattles.fulfilled, (state, action) => {
        state.loading = false;
        state.battles = action.payload;
      })
      .addCase(fetchBattles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unable to load battles.";
      })
      .addCase(createBattle.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createBattle.fulfilled, (state, action) => {
        state.isCreating = false;
        state.battles = upsertBattle(state.battles, action.payload);
      })
      .addCase(createBattle.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload ?? action.error.message ?? "Failed to create battle.";
      })
      .addCase(updateBattle.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateBattle.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.battles = replaceBattle(state.battles, action.payload);
      })
      .addCase(updateBattle.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload ?? action.error.message ?? "Failed to update battle.";
      })
      .addCase(startBattle.pending, (state, action) => {
        state.startingBattleId = action.meta.arg;
        state.error = null;
      })
      .addCase(startBattle.fulfilled, (state, action) => {
        state.startingBattleId = null;
        state.battles = replaceBattle(state.battles, action.payload);

        if (state.selectedBattleId === action.payload.id && !isConfigurableStatus(action.payload.status)) {
          state.isDrawerOpen = false;
          state.selectedBattleId = null;
          state.drawerAdvancedOptions = false;
        }
      })
      .addCase(startBattle.rejected, (state, action) => {
        state.startingBattleId = null;
        state.error = action.payload ?? action.error.message ?? "Failed to start battle.";
      });
  },
});

export const hostBattleReducer = hostBattleSlice.reducer;
export const {
  upsertBattleRecord,
  setShowAdvancedOptions,
  setDrawerAdvancedOptions,
  openDrawer,
  closeDrawer,
  clearError,
} = hostBattleSlice.actions;

