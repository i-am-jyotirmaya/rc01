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
  startMode: "manual" | "scheduled";
  scheduledStartAt?: string | null;
  allowSpectators: boolean;
  voiceChat: boolean;
  teamBalancing: boolean;
  problems: BattleProblemSummary[];
  primaryLanguagePool: string[];
  notes?: string;
}

export interface ProblemCatalogEntry extends BattleProblemSummary {
  lastModifiedAt?: string;
  author?: string;
}
