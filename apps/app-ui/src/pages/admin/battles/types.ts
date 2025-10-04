export type BattleConfigStatus = "draft" | "configuring" | "ready" | "scheduled";

export interface BattleProblemSummary {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  estimatedDurationMinutes?: number;
  tags: string[];
}

export interface BattleConfigDraft {
  battleId: string;
  name: string;
  status: BattleConfigStatus;
  shortDescription: string;
  gameMode?: string;
  difficulty?: string;
  maxPlayers?: number | null;
  privacy: "public" | "invite";
  startMode: "manual" | "scheduled";
  scheduledStartAt?: string | null;
  allowSpectators: boolean;
  voiceChat: boolean;
  teamBalancing: boolean;
  problems: BattleProblemSummary[];
  primaryLanguagePool: string[];
  notes?: string;
  turnTimeLimit?: number | null;
  totalDuration?: number | null;
  scoringRules?: string;
  tieBreakPreference?: string;
  powerUps: string[];
  ratingFloor?: number | null;
  ratingCeiling?: number | null;
  moderatorRoles: string[];
  preloadedResources?: string;
  rematchDefaults: boolean;
  joinQueueSize?: number | null;
  password?: string;
  linkExpiry?: string;
}

export interface ProblemCatalogEntry extends BattleProblemSummary {
  lastModifiedAt?: string;
  author?: string;
}
