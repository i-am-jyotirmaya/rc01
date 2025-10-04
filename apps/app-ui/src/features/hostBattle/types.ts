import type { Dayjs } from "dayjs";

export type PrivacySetting = "public" | "invite";

export type StartMode = "manual" | "scheduled";

export interface HostBattleFormValues {
  battleName: string;
  shortDescription?: string;
  gameMode?: string;
  difficulty?: string;
  maxPlayers?: number;
  privacy: PrivacySetting;
  allowSpectators: boolean;
  voiceChat: boolean;
  startMode: StartMode;
  scheduledStartAt?: Dayjs | null;
  turnTimeLimit?: number;
  totalDuration?: number;
  scoringRules?: string;
  tieBreakPreference?: string;
  powerUps?: string[];
  teamBalancing: boolean;
  ratingFloor?: number;
  ratingCeiling?: number;
  moderatorRoles?: string[];
  preloadedResources?: string;
  rematchDefaults: boolean;
  joinQueueSize?: number;
  password?: string;
  linkExpiry?: string;
}
