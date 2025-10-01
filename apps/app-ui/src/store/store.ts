import { configureStore } from "@reduxjs/toolkit";
import { arenaReducer } from "../features/arena/arenaSlice";

export const store = configureStore({
  reducer: {
    arena: arenaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
