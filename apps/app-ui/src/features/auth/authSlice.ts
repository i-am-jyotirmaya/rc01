import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LoginRequestPayload,
  LoginResponsePayload,
  RegisterRequestPayload,
  RegisterResponsePayload,
} from "@rc/api-client";
import { ApiError } from "@rc/api-client";
import { authApi } from "../../services/api";

export type AuthUiMode = "login" | "register";

export interface LoginFormValues extends LoginRequestPayload {}
export interface RegisterFormValues extends RegisterRequestPayload {
  confirmPassword: string;
}

interface AuthState {
  modalOpen: boolean;
  mode: AuthUiMode;
  status: "idle" | "submitting" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  modalOpen: false,
  mode: "login",
  status: "idle",
  error: null,
};

export const submitLogin = createAsyncThunk<
  LoginResponsePayload,
  LoginFormValues,
  { rejectValue: string }
>("auth/submitLogin", async (payload, { rejectWithValue }) => {
  try {
    return await authApi.login(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("We hit a snag while logging you in. Please try again soon.");
  }
});

export const submitRegistration = createAsyncThunk<
  RegisterResponsePayload,
  RegisterFormValues,
  { rejectValue: string }
>("auth/submitRegistration", async (payload, { rejectWithValue }) => {
  const { confirmPassword, ...request } = payload;
  try {
    return await authApi.register(request);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Account creation is unavailable right now. Please try again later.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openLoginModal(state) {
      state.modalOpen = true;
      state.mode = "login";
      state.error = null;
    },
    closeLoginModal(state) {
      state.modalOpen = false;
      state.status = "idle";
      state.error = null;
    },
    setAuthMode(state, action: PayloadAction<AuthUiMode>) {
      state.mode = action.payload;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitLogin.pending, (state) => {
        state.status = "submitting";
        state.error = null;
      })
      .addCase(submitLogin.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(submitLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to process login.";
      })
      .addCase(submitRegistration.pending, (state) => {
        state.status = "submitting";
        state.error = null;
      })
      .addCase(submitRegistration.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(submitRegistration.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to create an account right now.";
      });
  },
});

export const { openLoginModal, closeLoginModal, setAuthMode, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
