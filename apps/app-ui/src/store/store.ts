import { configureStore } from "@reduxjs/toolkit";
import { arenaReducer } from "../features/arena/arenaSlice";
import { authReducer } from "../features/auth/authSlice";
import { environmentReducer } from "../features/environment/environmentSlice";
import { hostBattleReducer } from "../features/hostBattle/hostBattleSlice";

export const store = configureStore({
  reducer: {
    arena: arenaReducer,
    auth: authReducer,
    environment: environmentReducer,
    hostBattle: hostBattleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
