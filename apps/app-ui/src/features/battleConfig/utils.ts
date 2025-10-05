import type { BattleRecord } from "@rc01/api-client";

import type { BattleConfigDraft, BattleConfigStatus, BattleProblemSummary } from "./types";

export const createInitialDraft = (battleId: string): BattleConfigDraft => ({
  battleId,
  name: "",
  status: "draft",
  shortDescription: "",
  gameMode: undefined,
  difficulty: undefined,
  maxPlayers: null,
  privacy: "public",
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
  linkExpiry: undefined,
});

export const mapBattleToDraft = (battle: BattleRecord): BattleConfigDraft => {
  const configuration = (battle.configuration ?? {}) as Partial<BattleConfigDraft>;
  const problems = Array.isArray(configuration.problems)
    ? (configuration.problems as BattleProblemSummary[])
    : [];

  const status = (battle.status as BattleConfigStatus) ?? "draft";

  return {
    ...createInitialDraft(battle.id),
    ...configuration,
    battleId: battle.id,
    name: battle.name,
    status,
    shortDescription: battle.shortDescription ?? "",
    startMode: battle.autoStart ? "scheduled" : "manual",
    scheduledStartAt: battle.scheduledStartAt,
    problems,
  };
};

export const buildConfigurationPayload = (draft: BattleConfigDraft): Record<string, unknown> => ({
  gameMode: draft.gameMode,
  difficulty: draft.difficulty,
  maxPlayers: draft.maxPlayers,
  privacy: draft.privacy,
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
  password: draft.password,
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
