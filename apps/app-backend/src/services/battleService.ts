import { EventEmitter } from 'node:events';
import createHttpError from 'http-errors';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import {
  insertBattle,
  listBattles,
  updateBattleById,
  findBattleById,
  listScheduledBattles,
  insertBattleParticipant,
  findBattleParticipant,
  listBattleParticipantsByBattle,
  updateBattleParticipantById,
  insertBattleInvite,
  findBattleInviteByToken,
  listBattleInvitesByBattle,
  updateBattleInviteById,
  type BattleStatus,
  type DbBattleRow,
  type UpdateBattlePayload,
  type DbBattleParticipantRow,
  type BattleParticipantRole,
  type BattleParticipantStatus,
  type DbBattleInviteRow,
} from '@rc01/db';
import { logger } from '../utils/logger.js';

export type BattleStartMode = 'manual' | 'scheduled';

export type BattleVisibilityMode = 'public' | 'invite-only' | 'password';

export type BattleConfiguration = {
  allowSpectators: boolean;
  maxContestants: number;
  visibility: BattleVisibilityMode;
  passwordRequired: boolean;
} & Record<string, unknown>;

export type BattleRecord = {
  id: string;
  name: string;
  shortDescription: string | null;
  status: BattleStatus;
  configuration: BattleConfiguration;
  autoStart: boolean;
  scheduledStartAt: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BattleParticipantRecord = {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
  status: BattleParticipantStatus;
  permissions: BattlePermission[];
  invitedAt: string;
  joinedAt: string | null;
  leftAt: string | null;
  isContestant: boolean;
};

export type BattleInviteRecord = {
  id: string;
  battleId: string;
  token: string;
  createdByUserId: string;
  createdAt: string;
  revokedAt: string | null;
};

export type BattlePermission =
  | 'battle.view'
  | 'battle.configure'
  | 'battle.manageProblems'
  | 'battle.manageParticipants'
  | 'battle.manageInvitations'
  | 'battle.start'
  | 'battle.play'
  | 'battle.submitSolution'
  | 'battle.viewSubmissions';

type BattleEventMap = {
  'battle.lobby-opened': [BattleRecord];
  'battle.status-changed': [{ battleId: string; status: BattleStatus }];
  'battle.participant-joined': [{ battleId: string; participant: BattleParticipantRecord }];
  'battle.participant-left': [{ battleId: string; participant: BattleParticipantRecord }];
  'battle.participant-updated': [{ battleId: string; participant: BattleParticipantRecord }];
  'battle.contestants-updated': [{ battleId: string; contestants: BattleParticipantRecord[] }];
  'battle.invite-created': [{ battleId: string; invite: BattleInviteRecord }];
  'battle.invite-revoked': [{ battleId: string; inviteId: string }];
};

export const battleEvents = new EventEmitter<BattleEventMap>();

export type CreateBattleInput = {
  name: string;
  shortDescription?: string | null;
  configuration?: Record<string, unknown>;
  startMode: BattleStartMode;
  scheduledStartAt?: Date | null;
  createdByUserId: string;
};

export type UpdateBattleInput = Partial<CreateBattleInput> & {
  status?: BattleStatus;
};

export type JoinBattleInput = {
  battleId: string;
  userId: string;
  role?: BattleParticipantRole;
  password?: string;
  inviteToken?: string;
};

export type JoinBattleResult = {
  participant: BattleParticipantRecord;
  wasCreated: boolean;
};

export type UpdateParticipantRoleInput = {
  battleId: string;
  actingUserId: string;
  targetUserId: string;
  role: Exclude<BattleParticipantRole, 'owner'>;
};

export type UpdateBattleContestantsInput = {
  battleId: string;
  actingUserId: string;
  contestantUserIds: string[];
};

export type CreateBattleInviteInput = {
  battleId: string;
  userId: string;
};

export type RevokeBattleInviteInput = {
  battleId: string;
  userId: string;
  inviteId: string;
};

const CONFIGURABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled'];
const DEFAULT_PARTICIPANT_ROLE: BattleParticipantRole = 'user';
const USER_JOINABLE_STATUSES: BattleStatus[] = ['lobby', 'active'];
const MANAGEMENT_JOINABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled', 'lobby', 'active'];
const ACCEPTED_PARTICIPANT_STATUS: BattleParticipantStatus = 'accepted';
const PENDING_PARTICIPANT_STATUS: BattleParticipantStatus = 'pending';
const LEFT_PARTICIPANT_STATUS: BattleParticipantStatus = 'left';

type PersistedBattleConfiguration = {
  allowSpectators: boolean;
  maxContestants: number;
  visibility: BattleVisibilityMode;
  passwordHash: string | null;
  extras: Record<string, unknown>;
};

const MAX_CONTESTANTS_LIMIT = 50;
const MIN_CONTESTANTS_LIMIT = 1;
const DEFAULT_MAX_CONTESTANTS = 2;
const BCRYPT_ROUNDS = 10;

const ROLE_PERMISSIONS = {
  owner: [
    'battle.view',
    'battle.configure',
    'battle.manageProblems',
    'battle.manageParticipants',
    'battle.manageInvitations',
    'battle.start',
    'battle.play',
    'battle.submitSolution',
    'battle.viewSubmissions',
  ],
  admin: [
    'battle.view',
    'battle.configure',
    'battle.manageProblems',
    'battle.manageParticipants',
    'battle.manageInvitations',
    'battle.start',
    'battle.play',
    'battle.submitSolution',
    'battle.viewSubmissions',
  ],
  editor: [
    'battle.view',
    'battle.configure',
    'battle.manageProblems',
    'battle.play',
    'battle.submitSolution',
    'battle.viewSubmissions',
  ],
  user: ['battle.view', 'battle.play', 'battle.submitSolution', 'battle.viewSubmissions'],
} as const satisfies Record<BattleParticipantRole, readonly BattlePermission[]>;

export const battleRoleCapabilities: Readonly<Record<BattleParticipantRole, readonly BattlePermission[]>> = ROLE_PERMISSIONS;

const getPermissionsForRole = (role: BattleParticipantRole): BattlePermission[] => {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
};

export const getBattleRolePermissions = (role: BattleParticipantRole): BattlePermission[] =>
  getPermissionsForRole(role);

const normalizeParticipantRole = (role?: BattleParticipantRole): BattleParticipantRole => role ?? DEFAULT_PARTICIPANT_ROLE;

const isManagementRole = (role: BattleParticipantRole): boolean => role === 'owner' || role === 'admin' || role === 'editor';

const canAssignRoles = (role: BattleParticipantRole): boolean => role === 'owner' || role === 'admin';

const canRoleJoinBattle = (status: BattleStatus, role: BattleParticipantRole): boolean => {
  if (isManagementRole(role)) {
    return MANAGEMENT_JOINABLE_STATUSES.includes(status);
  }

  return USER_JOINABLE_STATUSES.includes(status);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const clampContestantCount = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const rounded = Math.floor(parsed);
  return Math.min(MAX_CONTESTANTS_LIMIT, Math.max(MIN_CONTESTANTS_LIMIT, rounded));
};

const parseVisibilityMode = (value: unknown, fallback: BattleVisibilityMode): BattleVisibilityMode => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'invite-only' || normalized === 'inviteonly') {
    return 'invite-only';
  }
  if (normalized === 'password') {
    return 'password';
  }
  if (normalized === 'public') {
    return 'public';
  }

  return fallback;
};

const parseBooleanFlag = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

const DEFAULT_PERSISTED_CONFIGURATION: PersistedBattleConfiguration = {
  allowSpectators: true,
  maxContestants: DEFAULT_MAX_CONTESTANTS,
  visibility: 'public',
  passwordHash: null,
  extras: {},
};

const sanitizePersistedConfiguration = (value: unknown): PersistedBattleConfiguration => {
  const record = isRecord(value) ? { ...value } : {};

  const allowSpectators = parseBooleanFlag(record.allowSpectators, DEFAULT_PERSISTED_CONFIGURATION.allowSpectators);
  const maxContestants = clampContestantCount(record.maxContestants, DEFAULT_PERSISTED_CONFIGURATION.maxContestants);
  const visibility = parseVisibilityMode(record.visibility, DEFAULT_PERSISTED_CONFIGURATION.visibility);
  const passwordHash = typeof record.passwordHash === 'string' && record.passwordHash.trim()
    ? record.passwordHash
    : null;

  delete record.allowSpectators;
  delete record.maxContestants;
  delete record.visibility;
  delete record.password;
  delete record.passwordHash;

  return {
    allowSpectators,
    maxContestants,
    visibility,
    passwordHash,
    extras: record,
  };
};

const buildPersistedConfigurationObject = (config: PersistedBattleConfiguration): Record<string, unknown> => {
  const persisted: Record<string, unknown> = {
    ...config.extras,
    allowSpectators: config.allowSpectators,
    maxContestants: config.maxContestants,
    visibility: config.visibility,
  };

  if (config.passwordHash) {
    persisted.passwordHash = config.passwordHash;
  }

  return persisted;
};

const toPublicConfiguration = (config: PersistedBattleConfiguration): BattleConfiguration => ({
  ...config.extras,
  allowSpectators: config.allowSpectators,
  maxContestants: config.maxContestants,
  visibility: config.visibility,
  passwordRequired: config.visibility === 'password' && Boolean(config.passwordHash),
});

const prepareConfigurationForPersist = async (
  input: Record<string, unknown> | undefined,
  existing?: PersistedBattleConfiguration,
): Promise<PersistedBattleConfiguration> => {
  const base = existing ?? DEFAULT_PERSISTED_CONFIGURATION;
  const incoming = isRecord(input) ? input : {};

  const allowSpectators = parseBooleanFlag(incoming.allowSpectators, base.allowSpectators);
  const maxContestants = clampContestantCount(incoming.maxContestants, base.maxContestants);
  const visibility = parseVisibilityMode(incoming.visibility, base.visibility);

  let passwordHash = base.passwordHash;

  if (visibility !== 'password') {
    passwordHash = null;
  } else if (Object.prototype.hasOwnProperty.call(incoming, 'password')) {
    const rawPassword = typeof incoming.password === 'string' ? incoming.password.trim() : '';
    if (!rawPassword) {
      throw createHttpError(400, 'Password is required when visibility is set to "password"');
    }
    passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
  } else if (!passwordHash) {
    throw createHttpError(400, 'Password is required when visibility is set to "password"');
  }

  const extras = { ...base.extras };
  for (const [key, value] of Object.entries(incoming)) {
    if (['allowSpectators', 'maxContestants', 'visibility', 'password'].includes(key)) {
      continue;
    }
    extras[key] = value;
  }

  return {
    allowSpectators,
    maxContestants,
    visibility,
    passwordHash,
    extras,
  };
};

const getParticipantOrThrow = async (
  battleId: string,
  userId: string,
  errorStatus: number,
  errorMessage: string,
): Promise<DbBattleParticipantRow> => {
  const participant = await findBattleParticipant(battleId, userId);
  if (!participant) {
    throw createHttpError(errorStatus, errorMessage);
  }

  return participant;
};

const requireAcceptedParticipant = async (
  battleId: string,
  userId: string,
  errorStatus = 403,
  errorMessage = 'You are not participating in this battle',
): Promise<DbBattleParticipantRow> => {
  const participant = await getParticipantOrThrow(battleId, userId, errorStatus, errorMessage);

  if (participant.status !== ACCEPTED_PARTICIPANT_STATUS) {
    throw createHttpError(errorStatus, errorMessage);
  }

  return participant;
};

const assertBattleNotLocked = (battle: DbBattleRow): void => {
  if (battle.status === 'active' || battle.status === 'completed' || battle.status === 'cancelled') {
    throw createHttpError(409, 'Battle can no longer be modified');
  }
};

const toBattleRecord = (row: DbBattleRow): BattleRecord => {
  const persistedConfig = sanitizePersistedConfiguration(row.configuration);

  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    status: row.status,
    configuration: toPublicConfiguration(persistedConfig),
    autoStart: row.auto_start,
    scheduledStartAt: row.scheduled_start_at ? row.scheduled_start_at.toISOString() : null,
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

const toBattleParticipantRecord = (row: DbBattleParticipantRow): BattleParticipantRecord => ({
  id: row.id,
  battleId: row.battle_id,
  userId: row.user_id,
  role: row.role,
  status: row.status,
  permissions: getPermissionsForRole(row.role),
  invitedAt: row.created_at.toISOString(),
  joinedAt: row.accepted_at ? row.accepted_at.toISOString() : null,
  leftAt: row.left_at ? row.left_at.toISOString() : null,
  isContestant: row.is_contestant,
});

const toBattleInviteRecord = (row: DbBattleInviteRow): BattleInviteRecord => ({
  id: row.id,
  battleId: row.battle_id,
  token: row.token,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at.toISOString(),
  revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null,
});

class BattleScheduler {
  private timers = new Map<string, NodeJS.Timeout>();

  schedule(row: DbBattleRow, start: (battleId: string) => Promise<BattleRecord | void>): void {
    if (!row.scheduled_start_at) {
      this.cancel(row.id);
      return;
    }

    const delay = row.scheduled_start_at.getTime() - Date.now();
    if (delay <= 0) {
      this.cancel(row.id);
      void start(row.id);
      return;
    }

    this.cancel(row.id);
    const timer = setTimeout(() => {
      this.timers.delete(row.id);
      void start(row.id);
    }, delay);

    this.timers.set(row.id, timer);
  }

  cancel(battleId: string): void {
    const timer = this.timers.get(battleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(battleId);
    }
  }

  async restore(start: (battleId: string) => Promise<BattleRecord | void>): Promise<void> {
    const scheduledBattles = await listScheduledBattles();
    scheduledBattles.forEach((battle: DbBattleRow) => {
      this.schedule(battle, start);
    });
  }
}

const scheduler = new BattleScheduler();

const sanitizeName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw createHttpError(400, 'Battle name is required');
  }
  return trimmed;
};

const normalizeShortDescription = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const determineStartPlan = (
  startMode: BattleStartMode,
  scheduledStartAt?: Date | null,
): {
  status: BattleStatus;
  autoStart: boolean;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
} => {
  if (startMode === 'scheduled' && scheduledStartAt) {
    if (scheduledStartAt.getTime() <= Date.now()) {
      return {
        status: 'active',
        autoStart: false,
        scheduledStartAt: null,
        startedAt: new Date(),
      };
    }

    return {
      status: 'scheduled',
      autoStart: true,
      scheduledStartAt,
      startedAt: null,
    };
  }

  return {
    status: 'draft',
    autoStart: false,
    scheduledStartAt: null,
    startedAt: null,
  };
};

const determineUpdatePlan = (
  existing: DbBattleRow,
  startMode: BattleStartMode,
  scheduledStartAt?: Date | null,
  explicitStatus?: BattleStatus,
): {
  status: BattleStatus;
  autoStart: boolean;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
} => {
  if (explicitStatus) {
    return {
      status: explicitStatus,
      autoStart: startMode === 'scheduled',
      scheduledStartAt: startMode === 'scheduled' ? scheduledStartAt ?? existing.scheduled_start_at : null,
      startedAt: explicitStatus === 'active' ? existing.started_at ?? new Date() : existing.started_at,
    };
  }

  if (startMode === 'scheduled' && scheduledStartAt) {
    if (scheduledStartAt.getTime() <= Date.now()) {
      return {
        status: 'active',
        autoStart: false,
        scheduledStartAt: null,
        startedAt: new Date(),
      };
    }

    return {
      status: 'scheduled',
      autoStart: true,
      scheduledStartAt,
      startedAt: existing.started_at,
    };
  }

  return {
    status: 'ready',
    autoStart: false,
    scheduledStartAt: null,
    startedAt: existing.started_at,
  };
};

export const initializeBattleScheduling = async (): Promise<void> => {
  await scheduler.restore(async (battleId) => {
    try {
      await startBattle(battleId);
    } catch (error) {
      logger.error(`Failed to auto-start battle ${battleId}`, error);
    }
  });
};

export const getBattles = async (): Promise<BattleRecord[]> => {
  const rows = await listBattles();
  return rows.map(toBattleRecord);
};

export const getBattleById = async (id: string): Promise<BattleRecord> => {
  const row = await findBattleById(id);
  if (!row) {
    throw createHttpError(404, 'Battle not found');
  }

  return toBattleRecord(row);
};

export const listBattleParticipants = async (
  battleId: string,
  userId: string,
): Promise<BattleParticipantRecord[]> => {
  const battle = await findBattleById(battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  await requireAcceptedParticipant(
    battleId,
    userId,
    403,
    'You must join the battle before viewing participants',
  );

  const participants = await listBattleParticipantsByBattle(battleId);
  return participants.map(toBattleParticipantRecord);
};

export const createBattle = async (input: CreateBattleInput): Promise<BattleRecord> => {
  const name = sanitizeName(input.name);
  const shortDescription = normalizeShortDescription(input.shortDescription);
  const configurationPlan = await prepareConfigurationForPersist(input.configuration, DEFAULT_PERSISTED_CONFIGURATION);

  const plan = determineStartPlan(input.startMode, input.scheduledStartAt ?? null);
  const battleId = uuid();

  const created = await insertBattle({
    id: battleId,
    name,
    shortDescription: shortDescription ?? null,
    status: plan.status,
    configuration: buildPersistedConfigurationObject(configurationPlan),
    autoStart: plan.autoStart,
    scheduledStartAt: plan.scheduledStartAt,
    startedAt: plan.startedAt,
  });

  const ownerParticipant = await insertBattleParticipant({
    id: uuid(),
    battleId,
    userId: input.createdByUserId,
    role: 'owner',
    status: ACCEPTED_PARTICIPANT_STATUS,
    acceptedAt: new Date(),
    isContestant: false,
  });

  battleEvents.emit('battle.participant-joined', {
    battleId,
    participant: toBattleParticipantRecord(ownerParticipant),
  });

  if (created.auto_start && created.scheduled_start_at) {
    scheduler.schedule(created, (battleIdToStart) => startBattle(battleIdToStart));
  }

  return toBattleRecord(created);
};

export const updateBattle = async (id: string, input: UpdateBattleInput): Promise<BattleRecord> => {
  const existing = await findBattleById(id);
  if (!existing) {
    throw createHttpError(404, 'Battle not found');
  }

  if (!CONFIGURABLE_STATUSES.includes(existing.status)) {
    throw createHttpError(409, `Battles in status "${existing.status}" cannot be configured`);
  }

  if (input.status === 'lobby' && existing.status !== 'ready' && existing.status !== 'scheduled') {
    throw createHttpError(409, `Battles in status "${existing.status}" cannot enter the lobby`);
  }

  const startMode = input.startMode ?? (existing.auto_start ? 'scheduled' : 'manual');
  const shortDescription = normalizeShortDescription(input.shortDescription ?? undefined);
  const existingConfig = sanitizePersistedConfiguration(existing.configuration);
  const plan = determineUpdatePlan(
    existing,
    startMode,
    input.scheduledStartAt ?? existing.scheduled_start_at,
    input.status,
  );

  const updates: UpdateBattlePayload = {
    status: plan.status,
    autoStart: plan.autoStart,
    scheduledStartAt: plan.scheduledStartAt,
    startedAt: plan.startedAt,
  };

  if (input.name) {
    updates.name = sanitizeName(input.name);
  }

  if (shortDescription !== undefined) {
    updates.shortDescription = shortDescription;
  }

  if (input.configuration !== undefined) {
    const configurationPlan = await prepareConfigurationForPersist(input.configuration, existingConfig);

    if (configurationPlan.maxContestants < existingConfig.maxContestants) {
      const participants = await listBattleParticipantsByBattle(id);
      const activeContestants = participants.filter(
        (participant) =>
          participant.status === ACCEPTED_PARTICIPANT_STATUS && participant.is_contestant,
      ).length;

      if (configurationPlan.maxContestants < activeContestants) {
        throw createHttpError(
          409,
          `Cannot reduce max contestants below current contestant count (${activeContestants}).`,
        );
      }
    }

    updates.configuration = buildPersistedConfigurationObject(configurationPlan);
  }

  const updated = await updateBattleById(id, updates);

  if (!updated) {
    throw createHttpError(404, 'Battle not found');
  }

  if (updated.auto_start && updated.scheduled_start_at) {
    scheduler.schedule(updated, (battleIdToStart) => startBattle(battleIdToStart));
  } else {
    scheduler.cancel(id);
  }

  const record = toBattleRecord(updated);

  if (existing.status !== record.status) {
    battleEvents.emit('battle.status-changed', { battleId: id, status: record.status });
  }

  if (record.status === 'lobby') {
    battleEvents.emit('battle.lobby-opened', record);
  }

  return record;
};

export const joinBattle = async (input: JoinBattleInput): Promise<JoinBattleResult> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const configuration = sanitizePersistedConfiguration(battle.configuration);
  const existingParticipant = await findBattleParticipant(input.battleId, input.userId);
  if (existingParticipant?.status === ACCEPTED_PARTICIPANT_STATUS) {
    return {
      participant: toBattleParticipantRecord(existingParticipant),
      wasCreated: false,
    };
  }

  const participantRole = existingParticipant?.role ?? normalizeParticipantRole(input.role);

  if (!existingParticipant && participantRole !== 'user') {
    throw createHttpError(403, `Only invited users can join with the "${participantRole}" role`);
  }

  const trimmedToken = input.inviteToken?.trim();
  let invite: DbBattleInviteRow | null = null;

  if (trimmedToken) {
    invite = await findBattleInviteByToken(trimmedToken);
    if (!invite || invite.battle_id !== input.battleId || invite.revoked_at) {
      throw createHttpError(403, 'Invalid or expired battle invitation token');
    }
  }

  if (!canRoleJoinBattle(battle.status, participantRole)) {
    throw createHttpError(409, `Battle cannot be joined while in status "${battle.status}"`);
  }

  const isUserRole = participantRole === 'user';

  if (isUserRole && battle.status === 'active' && !configuration.allowSpectators) {
    throw createHttpError(403, 'Spectators are not allowed to join this battle');
  }

  let hasInviteAccess = Boolean(invite);

  if (existingParticipant?.status === PENDING_PARTICIPANT_STATUS) {
    hasInviteAccess = true;
  } else if (existingParticipant && existingParticipant.role !== 'user') {
    hasInviteAccess = true;
  }

  if (!hasInviteAccess) {
    if (configuration.visibility === 'invite-only') {
      throw createHttpError(403, 'Battle can only be joined via invitation');
    }

    if (configuration.visibility === 'password') {
      const providedPassword = (input.password ?? '').trim();
      if (!providedPassword || !configuration.passwordHash) {
        throw createHttpError(403, 'A password is required to join this battle');
      }

      const isMatch = await bcrypt.compare(providedPassword, configuration.passwordHash);
      if (!isMatch) {
        throw createHttpError(403, 'Invalid password for this battle');
      }
    }
  }

  if (existingParticipant) {
    const accepted = await updateBattleParticipantById(existingParticipant.id, {
      status: ACCEPTED_PARTICIPANT_STATUS,
      acceptedAt: new Date(),
      leftAt: null,
    });

    const participant = toBattleParticipantRecord(accepted);
    battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

    return { participant, wasCreated: false };
  }

  if (participantRole !== 'user') {
    throw createHttpError(403, `Only invited users can join with the "${participantRole}" role`);
  }

  const participantRow = await insertBattleParticipant({
    id: uuid(),
    battleId: input.battleId,
    userId: input.userId,
    role: participantRole,
    status: ACCEPTED_PARTICIPANT_STATUS,
    acceptedAt: new Date(),
    isContestant: false,
    leftAt: null,
  });

  const participant = toBattleParticipantRecord(participantRow);
  battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

  return { participant, wasCreated: true };
};

export const leaveBattle = async (battleId: string, userId: string): Promise<BattleParticipantRecord> => {
  const participant = await findBattleParticipant(battleId, userId);
  if (!participant) {
    throw createHttpError(404, 'Participant not found');
  }

  if (participant.status !== ACCEPTED_PARTICIPANT_STATUS) {
    throw createHttpError(409, 'Participant is not currently joined to this battle');
  }

  const updated = await updateBattleParticipantById(participant.id, {
    status: LEFT_PARTICIPANT_STATUS,
    leftAt: new Date(),
    isContestant: false,
  });

  const record = toBattleParticipantRecord(updated);
  battleEvents.emit('battle.participant-left', { battleId, participant: record });

  return record;
};

export const updateBattleParticipantRole = async (
  input: UpdateParticipantRoleInput,
): Promise<BattleParticipantRecord> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  assertBattleNotLocked(battle);

  const actingParticipant = await requireAcceptedParticipant(
    input.battleId,
    input.actingUserId,
    403,
    'You must join the battle before managing participants',
  );

  if (!canAssignRoles(actingParticipant.role)) {
    throw createHttpError(403, 'You do not have permission to change participant roles');
  }

  if ((input.role as string) === 'owner') {
    throw createHttpError(400, 'Owner role cannot be reassigned');
  }

  const target = await getParticipantOrThrow(
    input.battleId,
    input.targetUserId,
    404,
    'Participant not found',
  );

  if (target.role === 'owner') {
    throw createHttpError(403, 'Owner role cannot be changed');
  }

  if (target.role === input.role) {
    return toBattleParticipantRecord(target);
  }

  const updated = await updateBattleParticipantById(target.id, { role: input.role });
  const record = toBattleParticipantRecord(updated);
  battleEvents.emit('battle.participant-updated', { battleId: input.battleId, participant: record });

  return record;
};

export const updateBattleContestants = async (
  input: UpdateBattleContestantsInput,
): Promise<BattleParticipantRecord[]> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  assertBattleNotLocked(battle);

  const actingParticipant = await requireAcceptedParticipant(
    input.battleId,
    input.actingUserId,
    403,
    'You must join the battle before managing contestants',
  );

  if (!canAssignRoles(actingParticipant.role)) {
    throw createHttpError(403, 'You do not have permission to choose contestants');
  }

  const configuration = sanitizePersistedConfiguration(battle.configuration);
  const desiredContestants = new Set(input.contestantUserIds.map((userId) => userId.trim()).filter(Boolean));

  if (desiredContestants.size > configuration.maxContestants) {
    throw createHttpError(
      409,
      `Cannot select more than ${configuration.maxContestants} contestants for this battle`,
    );
  }

  const participants = await listBattleParticipantsByBattle(input.battleId);

  const acceptedParticipants = participants.filter(
    (participant) => participant.status === ACCEPTED_PARTICIPANT_STATUS,
  );

  for (const userId of desiredContestants) {
    const participant = acceptedParticipants.find((item) => item.user_id === userId);
    if (!participant) {
      throw createHttpError(404, `Participant ${userId} is not part of this battle`);
    }
  }

  for (const participant of acceptedParticipants) {
    const shouldBeContestant = desiredContestants.has(participant.user_id);

    if (participant.is_contestant === shouldBeContestant) {
      continue;
    }

    const updated = await updateBattleParticipantById(participant.id, {
      isContestant: shouldBeContestant,
    });

    const record = toBattleParticipantRecord(updated);
    battleEvents.emit('battle.participant-updated', { battleId: input.battleId, participant: record });
  }

  const refreshed = await listBattleParticipantsByBattle(input.battleId);
  const contestants = refreshed
    .filter((participant) => participant.is_contestant && participant.status === ACCEPTED_PARTICIPANT_STATUS)
    .map(toBattleParticipantRecord);

  battleEvents.emit('battle.contestants-updated', { battleId: input.battleId, contestants });

  return contestants;
};

export const createBattleInvite = async (
  input: CreateBattleInviteInput,
): Promise<BattleInviteRecord> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const participant = await requireAcceptedParticipant(
    input.battleId,
    input.userId,
    403,
    'You must join the battle before inviting others',
  );

  if (!canAssignRoles(participant.role)) {
    throw createHttpError(403, 'You do not have permission to invite participants to this battle');
  }

  const invite = await insertBattleInvite({
    id: uuid(),
    battleId: input.battleId,
    token: uuid().replace(/-/g, ''),
    createdByUserId: participant.user_id,
    revokedAt: null,
  });

  const record = toBattleInviteRecord(invite);
  battleEvents.emit('battle.invite-created', { battleId: input.battleId, invite: record });

  return record;
};

export const listBattleInvites = async (
  battleId: string,
  userId: string,
): Promise<BattleInviteRecord[]> => {
  const battle = await findBattleById(battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const participant = await requireAcceptedParticipant(
    battleId,
    userId,
    403,
    'You must join the battle before viewing invitations',
  );

  const invites = await listBattleInvitesByBattle(battleId);

  if (canAssignRoles(participant.role)) {
    return invites.map(toBattleInviteRecord);
  }

  return invites
    .filter((invite) => invite.created_by_user_id === participant.user_id)
    .map(toBattleInviteRecord);
};

export const revokeBattleInvite = async (
  input: RevokeBattleInviteInput,
): Promise<BattleInviteRecord> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const participant = await requireAcceptedParticipant(
    input.battleId,
    input.userId,
    403,
    'You must join the battle before managing invitations',
  );

  const invites = await listBattleInvitesByBattle(input.battleId);
  const invite = invites.find((item) => item.id === input.inviteId);

  if (!invite) {
    throw createHttpError(404, 'Invite not found');
  }

  const canManageInvite = invite.created_by_user_id === participant.user_id || canAssignRoles(participant.role);

  if (!canManageInvite) {
    throw createHttpError(403, 'You do not have permission to revoke this invite');
  }

  if (invite.revoked_at) {
    return toBattleInviteRecord(invite);
  }

  const updated = await updateBattleInviteById(invite.id, { revokedAt: new Date() });
  const record = toBattleInviteRecord(updated);
  battleEvents.emit('battle.invite-revoked', { battleId: input.battleId, inviteId: record.id });

  return record;
};

export type InviteBattleParticipantInput = {
  battleId: string;
  inviterUserId: string;
  inviteeUserId: string;
  role: Exclude<BattleParticipantRole, 'owner'>;
};

export const inviteBattleParticipant = async (
  input: InviteBattleParticipantInput,
): Promise<BattleParticipantRecord> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const inviter = await findBattleParticipant(input.battleId, input.inviterUserId);
  if (!inviter || inviter.status !== ACCEPTED_PARTICIPANT_STATUS || !canAssignRoles(inviter.role)) {
    throw createHttpError(403, 'Only owners or admins can assign roles for this battle');
  }

  if ((input.role as string) === 'owner') {
    throw createHttpError(400, 'Owner role cannot be reassigned through invitations');
  }

  const existingInvitee = await findBattleParticipant(input.battleId, input.inviteeUserId);

  if (existingInvitee) {
    if (existingInvitee.role === 'owner') {
      throw createHttpError(403, 'Owner role cannot be reassigned through invitations');
    }

    const updates: { role?: BattleParticipantRole; status?: BattleParticipantStatus; acceptedAt?: Date | null } = {};

    if (existingInvitee.role !== input.role) {
      updates.role = input.role;
    }

    if (existingInvitee.status !== PENDING_PARTICIPANT_STATUS || updates.role) {
      updates.status = PENDING_PARTICIPANT_STATUS;
      updates.acceptedAt = null;
    }

    if (Object.keys(updates).length === 0) {
      return toBattleParticipantRecord(existingInvitee);
    }

    const updated = await updateBattleParticipantById(existingInvitee.id, updates);
    return toBattleParticipantRecord(updated);
  }

  const created = await insertBattleParticipant({
    id: uuid(),
    battleId: input.battleId,
    userId: input.inviteeUserId,
    role: input.role,
    status: PENDING_PARTICIPANT_STATUS,
    acceptedAt: null,
  });

  return toBattleParticipantRecord(created);
};

export const startBattle = async (id: string): Promise<BattleRecord> => {
  const existing = await findBattleById(id);
  if (!existing) {
    throw createHttpError(404, 'Battle not found');
  }

  if (existing.status !== 'ready' && existing.status !== 'scheduled' && existing.status !== 'lobby') {
    throw createHttpError(409, `Battle cannot be started from status "${existing.status}"`);
  }

  scheduler.cancel(id);

  const updated = await updateBattleById(id, {
    status: 'active',
    autoStart: false,
    scheduledStartAt: null,
    startedAt: existing.started_at ?? new Date(),
  });

  if (!updated) {
    throw createHttpError(404, 'Battle not found');
  }

  const record = toBattleRecord(updated);
  battleEvents.emit('battle.status-changed', { battleId: id, status: record.status });
  return record;
};

export const isConfigurableStatus = (status: BattleStatus): boolean => CONFIGURABLE_STATUSES.includes(status);
