import type {
  BattleParticipantRole,
  BattleParticipantStatus,
  CreateBattleInvitePayload,
  CreateBattleParticipantPayload,
  CreateBattlePayload,
  CreateUserPayload,
  DbBattleInviteRow,
  DbBattleParticipantRow,
  DbBattleRow,
  DbUserRow,
  UpdateBattleInvitePayload,
  UpdateBattleParticipantPayload,
  UpdateBattlePayload,
} from '../types.js';

export type PrismaUserRecord = {
  id: string;
  username: string;
  email: string;
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
  role: string;
  status: string;
  createdAt: Date;
  acceptedAt: Date | null;
  isContestant: boolean;
  leftAt: Date | null;
};

export type PrismaBattleInviteRecord = {
  id: string;
  battleId: string;
  token: string;
  createdByUserId: string;
  createdAt: Date;
  revokedAt: Date | null;
};

const parseBattleConfiguration = (value: unknown): Record<string, unknown> => {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch (error) {
      // fall through to return empty object when parsing fails
    }

    return {};
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
};

export const mapUser = (user: PrismaUserRecord): DbUserRow => ({
  id: user.id,
  username: user.username,
  email: user.email,
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
  configuration: parseBattleConfiguration(battle.configuration),
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
  role: participant.role as BattleParticipantRole,
  status: participant.status as BattleParticipantStatus,
  is_contestant: participant.isContestant,
  created_at: participant.createdAt,
  accepted_at: participant.acceptedAt ?? null,
  left_at: participant.leftAt ?? null,
});

export const mapBattleInvite = (invite: PrismaBattleInviteRecord): DbBattleInviteRow => ({
  id: invite.id,
  battle_id: invite.battleId,
  token: invite.token,
  created_by_user_id: invite.createdByUserId,
  created_at: invite.createdAt,
  revoked_at: invite.revokedAt ?? null,
});

export const toUserCreateData = (payload: CreateUserPayload) => ({
  id: payload.id,
  username: payload.username,
  email: payload.email,
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

export const toSqliteBattleCreateData = (payload: CreateBattlePayload) => ({
  ...toBattleCreateData(payload),
  configuration: JSON.stringify(payload.configuration ?? {}),
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

export const toSqliteBattleUpdateData = (payload: UpdateBattlePayload) => {
  const data = toBattleUpdateData(payload);

  if (payload.configuration !== undefined) {
    data.configuration = JSON.stringify(payload.configuration ?? {});
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
  status: payload.status ?? 'pending',
  acceptedAt: payload.acceptedAt ?? null,
  isContestant: payload.isContestant ?? false,
  leftAt: payload.leftAt ?? null,
});

export const toBattleParticipantUpdateData = (payload: UpdateBattleParticipantPayload) => {
  const data: Record<string, unknown> = {};

  if (payload.role !== undefined) {
    data.role = payload.role;
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (payload.acceptedAt !== undefined) {
    data.acceptedAt = payload.acceptedAt;
  }

  if (payload.isContestant !== undefined) {
    data.isContestant = payload.isContestant;
  }

  if (payload.leftAt !== undefined) {
    data.leftAt = payload.leftAt;
  }

  return data;
};

export const toBattleInviteCreateData = (payload: CreateBattleInvitePayload) => ({
  id: payload.id,
  battleId: payload.battleId,
  token: payload.token,
  createdByUserId: payload.createdByUserId,
  revokedAt: payload.revokedAt ?? null,
});

export const toBattleInviteUpdateData = (payload: UpdateBattleInvitePayload) => {
  const data: Record<string, unknown> = {};

  if (payload.revokedAt !== undefined) {
    data.revokedAt = payload.revokedAt;
  }

  return data;
};
