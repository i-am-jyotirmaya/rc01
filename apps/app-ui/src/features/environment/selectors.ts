import { findApiEnvironmentOption } from "../../config/api-environments";
import type { RootState } from "../../store/store";

export const selectEnvironmentState = (state: RootState) => state.environment;
export const selectCurrentEnvironmentKey = (state: RootState) => state.environment.currentKey;
export const selectCurrentEnvironment = (state: RootState) =>
  findApiEnvironmentOption(selectCurrentEnvironmentKey(state));
