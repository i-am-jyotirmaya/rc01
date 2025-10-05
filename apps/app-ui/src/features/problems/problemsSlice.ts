import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProblemMetadata } from "@rc01/api-client";

import { problemApi } from "../../services/api";

type ProblemsStatus = "idle" | "loading" | "succeeded" | "failed";

interface ProblemsState {
  items: ProblemMetadata[];
  status: ProblemsStatus;
  error: string | null;
}

const initialState: ProblemsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchProblems = createAsyncThunk<ProblemMetadata[], void, { rejectValue: string }>(
  "problems/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await problemApi.listProblems();
      return response.problems;
    } catch (error) {
      const message = (error as Error).message || "Unable to load problems.";
      return rejectWithValue(message);
    }
  },
);

const upsertProblemInState = (items: ProblemMetadata[], next: ProblemMetadata): ProblemMetadata[] => {
  const existingIndex = items.findIndex((item) => item.slug === next.slug);
  if (existingIndex >= 0) {
    const clone = items.slice();
    clone[existingIndex] = next;
    return clone;
  }

  return [next, ...items];
};

const removeProblemFromState = (items: ProblemMetadata[], slug: string): ProblemMetadata[] =>
  items.filter((item) => item.slug !== slug);

const problemsSlice = createSlice({
  name: "problems",
  initialState,
  reducers: {
    upsertProblem(state, action: PayloadAction<ProblemMetadata>) {
      state.items = upsertProblemInState(state.items, action.payload);
    },
    removeProblem(state, action: PayloadAction<string>) {
      state.items = removeProblemFromState(state.items, action.payload);
    },
    resetProblemsState(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Unable to load problems.";
      });
  },
});

export const { upsertProblem, removeProblem, resetProblemsState } = problemsSlice.actions;
export const problemsReducer = problemsSlice.reducer;
