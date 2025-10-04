import type { ColProps } from "antd";

export const basicSelectOptions = {
  gameModes: [
    { label: "Head-to-head", value: "head-to-head" },
    { label: "Team battle", value: "team" },
    { label: "Battle royale", value: "royale" },
  ],
  difficulty: [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Expert", value: "expert" },
  ],
};

export const advancedSelectOptions = {
  scoringRules: [
    { label: "Points per challenge", value: "points-per-challenge" },
    { label: "Time weighted", value: "time-weighted" },
    { label: "First-to-finish", value: "first-to-finish" },
  ],
  tieBreaks: [
    { label: "Fastest submission", value: "fastest-submission" },
    { label: "Highest accuracy", value: "highest-accuracy" },
    { label: "Rematch", value: "rematch" },
  ],
  powerUps: [
    { label: "Hint reveal", value: "hint" },
    { label: "Time freeze", value: "time-freeze" },
    { label: "Double points", value: "double-points" },
  ],
  moderatorRoles: [
    { label: "Judge", value: "judge" },
    { label: "Streamer", value: "streamer" },
    { label: "Scorekeeper", value: "scorekeeper" },
  ],
  resources: [
    { label: "Starter template", value: "starter-template" },
    { label: "Sample data pack", value: "sample-data" },
    { label: "Benchmark suite", value: "benchmark" },
  ],
  linkExpiry: [
    { label: "Never", value: "never" },
    { label: "24 hours", value: "24h" },
    { label: "7 days", value: "7d" },
    { label: "Custom", value: "custom" },
  ],
};

export const fieldColProps: ColProps = {
  xs: 24,
  md: 12,
};

export const advancedColProps: ColProps = {
  xs: 24,
  md: 12,
  lg: 8,
};
