import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "../../store/store";

export const selectProblemsState = (state: RootState) => state.problems;

export const selectProblems = createSelector(
  selectProblemsState,
  (state) => state.items,
);

export const selectProblemsStatus = createSelector(
  selectProblemsState,
  (state) => state.status,
);

export const selectProblemsError = createSelector(
  selectProblemsState,
  (state) => state.error,
);

export const selectProblemBySlug = (slug: string) =>
  createSelector(selectProblems, (items) => items.find((item) => item.slug === slug));
