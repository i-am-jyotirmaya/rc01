import type {
  BattleParticipantRole,
  CreateBattleParticipantPayload,
  CreateBattlePayload,
  CreateUserPayload,
  DbBattleParticipantRow,
  DbBattleRow,
  DbUserRow,
  UpdateBattlePayload,
} from '../types.js';

export type PrismaUserRecord = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  photoPath: string | null;
  createdAt: Date;
};

export type PrismaBattleRecord = {
  id: string;
  name: string;
  shortDescription: string | null;
  status: DbBattleRow['status'];
  configuration: unknown;
  autoStart: boolean;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PrismaBattleParticipantRecord = {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
  createdAt: Date;
};

export const mapUser = (user: PrismaUserRecord): DbUserRow => ({
  id: user.id,
  username: user.username,
  first_name: user.firstName,
  last_name: user.lastName,
  password_hash: user.passwordHash,
  photo_path: user.photoPath,
  created_at: user.createdAt,
});

export const mapBattle = (battle: PrismaBattleRecord): DbBattleRow => ({
  id: battle.id,
  name: battle.name,
  short_description: battle.shortDescription,
  status: battle.status,
  configuration: (battle.configuration ?? {}) as Record<string, unknown>,
  auto_start: battle.autoStart,
  scheduled_start_at: battle.scheduledStartAt,
  started_at: battle.startedAt,
  created_at: battle.createdAt,
  updated_at: battle.updatedAt,
});

export const mapBattleParticipant = (
  participant: PrismaBattleParticipantRecord,
): DbBattleParticipantRow => ({
  id: participant.id,
  battle_id: participant.battleId,
  user_id: participant.userId,
  role: participant.role,
  created_at: participant.createdAt,
});

export const toUserCreateData = (payload: CreateUserPayload) => ({
  id: payload.id,
  username: payload.username,
  firstName: payload.firstName,
  lastName: payload.lastName,
  passwordHash: payload.passwordHash,
  photoPath: payload.photoPath,
});

export const toBattleCreateData = (payload: CreateBattlePayload) => ({
  id: payload.id,
  name: payload.name,
  shortDescription: payload.shortDescription ?? null,
  status: payload.status,
  configuration: payload.configuration,
  autoStart: payload.autoStart,
  scheduledStartAt: payload.scheduledStartAt ?? null,
  startedAt: payload.startedAt ?? null,
});

export const toBattleUpdateData = (payload: UpdateBattlePayload) => {
  const data: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.shortDescription !== undefined) {
    data.shortDescription = payload.shortDescription;
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (payload.configuration !== undefined) {
    data.configuration = payload.configuration;
  }

  if (payload.autoStart !== undefined) {
    data.autoStart = payload.autoStart;
  }

  if (payload.scheduledStartAt !== undefined) {
    data.scheduledStartAt = payload.scheduledStartAt;
  }

  if (payload.startedAt !== undefined) {
    data.startedAt = payload.startedAt;
  }

  return data;
};

export const toBattleParticipantCreateData = (
  payload: CreateBattleParticipantPayload,
) => ({
  id: payload.id,
  battleId: payload.battleId,
  userId: payload.userId,
  role: payload.role,
});
