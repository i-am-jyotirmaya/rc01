import type { RootState } from "../../store/store";

export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthMode = (state: RootState) => state.auth.mode;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthModalOpen = (state: RootState) => state.auth.modalOpen;
