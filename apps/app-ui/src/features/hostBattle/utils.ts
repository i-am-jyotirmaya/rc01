import type {
  BattleRecord,
  BattleStatus,
  CreateBattleRequestPayload,
  UpdateBattleRequestPayload,
} from "@rc01/api-client";
import dayjs from "dayjs";
import type { HostBattleFormValues, StartMode } from "./types";

export const configurableStatuses: BattleStatus[] = ["draft", "configuring", "ready", "scheduled"];

export const statusMeta: Record<BattleStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "default" },
  configuring: { label: "Configuring", color: "gold" },
  ready: { label: "Ready", color: "green" },
  scheduled: { label: "Scheduled", color: "blue" },
  lobby: { label: "Lobby", color: "cyan" },
  active: { label: "Active", color: "purple" },
  completed: { label: "Completed", color: "default" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const formatDateTime = (value?: string | null) =>
  value ? dayjs(value).format("MMM D, YYYY h:mm A") : "—";

export const createErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const extractBattles = (response: unknown): BattleRecord[] => {
  const candidate = (response as { battles?: unknown }).battles;
  return Array.isArray(candidate) ? (candidate as BattleRecord[]) : [];
};

export const extractBattle = (response: unknown): BattleRecord | undefined => {
  const candidate = (response as { battle?: unknown }).battle;
  if (candidate && typeof candidate === "object") {
    return candidate as BattleRecord;
  }
  return undefined;
};

export const isConfigurableStatus = (status: BattleStatus) => configurableStatuses.includes(status);

export const baseFormDefaults: Partial<HostBattleFormValues> = {
  privacy: "public",
  allowSpectators: true,
  voiceChat: false,
  startMode: "manual",
  teamBalancing: true,
  rematchDefaults: false,
};

const advancedFieldKeys: (keyof HostBattleFormValues)[] = [
  "turnTimeLimit",
  "totalDuration",
  "scoringRules",
  "tieBreakPreference",
  "powerUps",
  "ratingFloor",
  "ratingCeiling",
  "moderatorRoles",
  "preloadedResources",
  "rematchDefaults",
  "joinQueueSize",
  "password",
  "linkExpiry",
];

export const shouldDisplayAdvanced = (values: Partial<HostBattleFormValues>) =>
  advancedFieldKeys.some((key) => {
    const value = values[key];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "number") {
      return value !== undefined && value !== null;
    }

    if (typeof value === "boolean") {
      return value === true;
    }

    return value !== undefined && value !== null && value !== "";
  });

export const buildBattlePayload = (
  values: HostBattleFormValues,
): {
  create: CreateBattleRequestPayload;
  update: UpdateBattleRequestPayload;
  configuration: Record<string, unknown>;
} => {
  const startMode = (values.startMode ?? "manual") as StartMode;
  const sanitizedName = values.battleName.trim();
  const shortDescription = values.shortDescription?.trim() ?? "";
  const scheduledStartAt =
    startMode === "scheduled"
      ? values.scheduledStartAt
        ? values.scheduledStartAt.toISOString()
        : null
      : null;

  const configurationInput = {
    ...values,
    battleName: sanitizedName,
    shortDescription: shortDescription || undefined,
    startMode,
    scheduledStartAt,
  };

  const configuration = JSON.parse(JSON.stringify(configurationInput)) as Record<string, unknown>;

  if (!shortDescription) {
    delete configuration.shortDescription;
  }

  if (startMode !== "scheduled") {
    configuration.scheduledStartAt = null;
  }

  const createPayload: CreateBattleRequestPayload = {
    name: sanitizedName,
    shortDescription: shortDescription ? shortDescription : null,
    configuration,
    startMode,
    scheduledStartAt,
  };

  const updatePayload: UpdateBattleRequestPayload = {
    name: sanitizedName,
    shortDescription: shortDescription ? shortDescription : null,
    configuration,
    startMode,
    scheduledStartAt,
  };

  return { create: createPayload, update: updatePayload, configuration };
};

export const extractFormValuesFromBattle = (
  battle: BattleRecord,
): Partial<HostBattleFormValues> => {
  const configuration = (battle.configuration ?? {}) as Record<string, unknown>;
  const storedStartMode =
    typeof configuration.startMode === "string" ? (configuration.startMode as StartMode) : undefined;
  const startMode: StartMode = storedStartMode ?? (battle.autoStart ? "scheduled" : "manual");

  const scheduledSource =
    battle.scheduledStartAt ??
    (typeof configuration.scheduledStartAt === "string"
      ? (configuration.scheduledStartAt as string)
      : null);

  const merged: Partial<HostBattleFormValues> = {
    ...baseFormDefaults,
    ...(configuration as Partial<HostBattleFormValues>),
    battleName: battle.name,
    shortDescription:
      battle.shortDescription ??
      (typeof configuration.shortDescription === "string"
        ? (configuration.shortDescription as string)
        : undefined),
    startMode,
    scheduledStartAt: scheduledSource ? dayjs(scheduledSource) : null,
  };

  if (typeof merged.allowSpectators !== "boolean") {
    merged.allowSpectators = true;
  }

  if (typeof merged.voiceChat !== "boolean") {
    merged.voiceChat = false;
  }

  if (typeof merged.teamBalancing !== "boolean") {
    merged.teamBalancing = true;
  }

  if (typeof merged.rematchDefaults !== "boolean") {
    merged.rematchDefaults = false;
  }

  return merged;
};
