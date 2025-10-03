import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  apiEnvironmentOptions,
  getInitialApiEnvironmentKey,
} from "../../config/api-environments";

interface EnvironmentState {
  currentKey: string;
}

const initialState: EnvironmentState = {
  currentKey: getInitialApiEnvironmentKey(),
};

const environmentSlice = createSlice({
  name: "environment",
  initialState,
  reducers: {
    setApiEnvironment(state, action: PayloadAction<string>) {
      const isValid = apiEnvironmentOptions.some((option) => option.key === action.payload);
      if (isValid) {
        state.currentKey = action.payload;
      }
    },
  },
});

export const { setApiEnvironment } = environmentSlice.actions;
export const environmentReducer = environmentSlice.reducer;
