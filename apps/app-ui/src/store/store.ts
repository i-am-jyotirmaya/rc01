import { configureStore } from "@reduxjs/toolkit";
import { arenaReducer } from "../features/arena/arenaSlice";
import { authReducer } from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    arena: arenaReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
