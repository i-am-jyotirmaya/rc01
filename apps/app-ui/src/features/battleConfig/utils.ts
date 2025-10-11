import type { BattleRecord } from "@rc01/api-client";

import type { BattleConfigDraft, BattleConfigStatus, BattleProblemSummary } from "./types";

export const createInitialDraft = (battleId: string): BattleConfigDraft => ({
  battleId,
  name: "",
  status: "draft",
  shortDescription: "",
  gameMode: undefined,
  difficulty: undefined,
  maxContestants: 2,
  visibility: "public",
  startMode: "manual",
  scheduledStartAt: null,
  allowSpectators: true,
  voiceChat: false,
  teamBalancing: true,
  problems: [],
  primaryLanguagePool: ["typescript"],
  notes: undefined,
  turnTimeLimit: null,
  totalDuration: null,
  scoringRules: undefined,
  tieBreakPreference: undefined,
  powerUps: [],
  ratingFloor: null,
  ratingCeiling: null,
  moderatorRoles: [],
  preloadedResources: undefined,
  rematchDefaults: false,
  joinQueueSize: null,
  password: undefined,
  passwordRequired: false,
  linkExpiry: undefined,
});

export const mapBattleToDraft = (battle: BattleRecord): BattleConfigDraft => {
  const configuration = (battle.configuration ?? {}) as Record<string, unknown>;
  const {
    allowSpectators = true,
    maxContestants,
    visibility = "public",
    passwordRequired = false,
    ...extras
  } = configuration;

  const problems = Array.isArray(extras.problems)
    ? (extras.problems as BattleProblemSummary[])
    : [];

  const status = (battle.status as BattleConfigStatus) ?? "draft";

  return {
    ...createInitialDraft(battle.id),
    ...(extras as Partial<BattleConfigDraft>),
    battleId: battle.id,
    name: battle.name,
    status,
    shortDescription: battle.shortDescription ?? "",
    startMode: battle.autoStart ? "scheduled" : "manual",
    scheduledStartAt: battle.scheduledStartAt,
    allowSpectators: Boolean(allowSpectators),
    maxContestants: typeof maxContestants === "number" ? maxContestants : null,
    visibility: (visibility as BattleConfigDraft["visibility"]) ?? "public",
    passwordRequired: Boolean(passwordRequired),
    password: undefined,
    problems,
  };
};

export const buildConfigurationPayload = (draft: BattleConfigDraft): Record<string, unknown> => ({
  gameMode: draft.gameMode,
  difficulty: draft.difficulty,
  maxContestants: draft.maxContestants,
  visibility: draft.visibility,
  allowSpectators: draft.allowSpectators,
  voiceChat: draft.voiceChat,
  teamBalancing: draft.teamBalancing,
  problems: draft.problems,
  primaryLanguagePool: draft.primaryLanguagePool,
  notes: draft.notes,
  turnTimeLimit: draft.turnTimeLimit,
  totalDuration: draft.totalDuration,
  scoringRules: draft.scoringRules,
  tieBreakPreference: draft.tieBreakPreference,
  powerUps: draft.powerUps,
  ratingFloor: draft.ratingFloor,
  ratingCeiling: draft.ratingCeiling,
  moderatorRoles: draft.moderatorRoles,
  preloadedResources: draft.preloadedResources,
  rematchDefaults: draft.rematchDefaults,
  joinQueueSize: draft.joinQueueSize,
  ...(draft.visibility === "password" && draft.password
    ? { password: draft.password }
    : {}),
  linkExpiry: draft.linkExpiry,
});

export const computeHasLocalChanges = (
  draft: BattleConfigDraft | null,
  original: BattleConfigDraft | null,
): boolean => {
  if (!draft || !original) {
    return false;
  }

  return JSON.stringify(draft) !== JSON.stringify(original);
};

export const cloneDraft = (draft: BattleConfigDraft): BattleConfigDraft =>
  JSON.parse(JSON.stringify(draft)) as BattleConfigDraft;
