import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  AuthResponsePayload,
  AuthUserPayload,
  LoginRequestPayload,
  RegisterRequestPayload,
} from "@rc/api-client";
import { ApiError } from "@rc/api-client";
import { authApi } from "../../services/api";

export type AuthUiMode = "login" | "register";

export type LoginFormValues = LoginRequestPayload;

interface AuthState {
  modalOpen: boolean;
  mode: AuthUiMode;
  status: "idle" | "submitting" | "succeeded" | "failed";
  error: string | null;
  user: AuthUserPayload | null;
  token: string | null;
}

type PersistedAuth = Pick<AuthState, "token" | "user">;

const AUTH_STORAGE_KEY = "rc.auth.session";

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const loadPersistedAuth = (): PersistedAuth | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAuth> | null;
    if (!parsed) {
      return null;
    }

    const token = typeof parsed.token === "string" ? parsed.token : null;
    const user =
      parsed.user && typeof parsed.user === "object"
        ? (parsed.user as AuthUserPayload)
        : null;

    return { token, user };
  } catch {
    return null;
  }
};

const persistAuth = (payload: AuthResponsePayload | null) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    if (payload) {
      storage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ token: payload.token, user: payload.user }),
      );
    } else {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage persistence issues
  }
};

const persistedAuth = loadPersistedAuth();

const initialState: AuthState = {
  modalOpen: false,
  mode: "login",
  status: "idle",
  error: null,
  user: persistedAuth?.user ?? null,
  token: persistedAuth?.token ?? null,
};

export const submitLogin = createAsyncThunk<
  AuthResponsePayload,
  LoginFormValues,
  { rejectValue: string }
>("auth/submitLogin", async (payload, { rejectWithValue }) => {
  try {
    const response = await authApi.login(payload);
    persistAuth(response);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue(
      "We hit a snag while logging you in. Please try again soon.",
    );
  }
});

export const submitRegistration = createAsyncThunk<
  AuthResponsePayload,
  RegisterRequestPayload,
  { rejectValue: string }
>("auth/submitRegistration", async (payload, { rejectWithValue }) => {
  try {
    const response = await authApi.register(payload);
    persistAuth(response);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue(
      "Account creation is unavailable right now. Please try again later.",
    );
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openLoginModal(state) {
      state.modalOpen = true;
      state.mode = "login";
      state.status = "idle";
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
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      persistAuth(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitLogin.pending, (state) => {
        state.status = "submitting";
        state.error = null;
      })
      .addCase(submitLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.modalOpen = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(submitLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to process login.";
      })
      .addCase(submitRegistration.pending, (state) => {
        state.status = "submitting";
        state.error = null;
      })
      .addCase(submitRegistration.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.modalOpen = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(submitRegistration.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ?? "Unable to create an account right now.";
      });
  },
});

export const { openLoginModal, closeLoginModal, setAuthMode, clearAuthError, logout } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
