import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store/store";

export type HeroIconKey = "code" | "team" | "thunderbolt" | "trophy";

export interface HeroPill {
  id: string;
  label: string;
}

export interface HeroStat {
  id: string;
  icon: HeroIconKey;
  label: string;
  value: string;
}

export interface HeroHighlight {
  id: string;
  icon: HeroIconKey;
  title: string;
  description: string;
}

export interface HeroFeature {
  icon: HeroIconKey;
  title: string;
  subtitle: string;
}

export interface HeroActions {
  primary: {
    label: string;
    icon: HeroIconKey;
  };
  secondary: {
    label: string;
  };
}

export interface HeroContent {
  title: string;
  subtitle: string;
  codeSnippet: string;
  pills: HeroPill[];
  stats: HeroStat[];
  highlights: HeroHighlight[];
  feature: HeroFeature;
  actions: HeroActions;
}

interface ArenaState {
  hero: HeroContent;
}

const initialState: ArenaState = {
  hero: {
    title: "CodeBattle Arena",
    subtitle:
      "A modern platform for rapid-fire coding competitions. Host anything from intimate code-offs to large-scale tournaments all within a delightful Ant Design experience.",
    codeSnippet: `const arena = createArena({\n  mode: "head-to-head",\n  timeLimit: 180,\n  language: "typescript",\n});`,
    pills: [
      { id: "real-time", label: "Real-time battles" },
      { id: "self-hosted", label: "Self-hostable" },
      { id: "community", label: "Built for communities" },
    ],
    stats: [
      {
        id: "arenas",
        icon: "code",
        label: "Live Coding Arenas",
        value: "Battle-ready in seconds",
      },
      {
        id: "teams",
        icon: "team",
        label: "Built for Teams",
        value: "Host invite-only matches",
      },
    ],
    highlights: [
      {
        id: "deploy",
        icon: "thunderbolt",
        title: "Deploy in minutes",
        description:
          "Launch real-time battles with ready-to-run templates and automated provisioning.",
      },
      {
        id: "stack",
        icon: "code",
        title: "Extend your stack",
        description:
          "Connect custom judging, analytics, and bots through flexible integrations.",
      },
      {
        id: "community",
        icon: "team",
        title: "Delight communities",
        description:
          "Keep players engaged with brackets, team modes, and shareable recaps.",
      },
    ],
    feature: {
      icon: "trophy",
      title: "Leaderboards and Spectator Mode",
      subtitle: "Engage your community with live rankings and broadcasts.",
    },
    actions: {
      primary: {
        label: "Get Started",
        icon: "thunderbolt",
      },
      secondary: {
        label: "Learn More",
      },
    },
  },
};

const arenaSlice = createSlice({
  name: "arena",
  initialState,
  reducers: {},
});

export const selectHeroContent = (state: RootState): HeroContent => state.arena.hero;

export const arenaReducer = arenaSlice.reducer;
