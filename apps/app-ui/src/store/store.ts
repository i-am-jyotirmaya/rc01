import { configureStore } from "@reduxjs/toolkit";
import { battleConfigReducer } from "../features/battleConfig/battleConfigSlice";
import { arenaReducer } from "../features/arena/arenaSlice";
import { authReducer } from "../features/auth/authSlice";
import { hostBattleReducer } from "../features/hostBattle/hostBattleSlice";
import { problemsReducer } from "../features/problems/problemsSlice";

export const store = configureStore({
  reducer: {
    arena: arenaReducer,
    auth: authReducer,
    hostBattle: hostBattleReducer,
    problems: problemsReducer,
    battleConfig: battleConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
