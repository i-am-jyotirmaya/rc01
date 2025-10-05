import { EventEmitter } from 'node:events';
import createHttpError from 'http-errors';
import { v4 as uuid } from 'uuid';
import {
  insertBattle,
  listBattles,
  updateBattleById,
  findBattleById,
  listScheduledBattles,
  insertBattleParticipant,
  findBattleParticipant,
  findBattleParticipantByRole,
  listBattleParticipantsByUser,
  updateBattleParticipantRole,
  type BattleStatus,
  type DbBattleRow,
  type UpdateBattlePayload,
  type DbBattleParticipantRow,
  type BattleParticipantRole,
} from '@rc01/db';
import { logger } from '../utils/logger.js';

export type BattleStartMode = 'manual' | 'scheduled';

export type BattleRecord = {
  id: string;
  name: string;
  shortDescription: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt: string | null;
  startedAt: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BattleParticipantRecord = {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
  joinedAt: string;
};

type BattleEventMap = {
  'battle.lobby-opened': [BattleRecord];
  'battle.participant-joined': [{ battleId: string; participant: BattleParticipantRecord }];
};

export const battleEvents = new EventEmitter<BattleEventMap>();

export type CreateBattleInput = {
  name: string;
  shortDescription?: string | null;
  configuration?: Record<string, unknown>;
  startMode: BattleStartMode;
  scheduledStartAt?: Date | null;
  ownerId: string;
};

export type UpdateBattleInput = Partial<CreateBattleInput> & {
  status?: BattleStatus;
};

export type JoinBattleInput = {
  battleId: string;
  userId: string;
  role?: BattleParticipantRole;
};

export type JoinBattleResult = {
  participant: BattleParticipantRecord;
  wasCreated: boolean;
};

export type AssignBattleRoleInput = {
  battleId: string;
  actorUserId: string;
  targetUserId: string;
  role: Exclude<BattleParticipantRole, 'owner'>;
};

const CONFIGURABLE_STATUSES: BattleStatus[] = ['draft', 'published'];
const DEFAULT_PARTICIPANT_ROLE: BattleParticipantRole = 'player';
const PLAYER_JOINABLE_STATUSES: BattleStatus[] = ['lobby', 'live'];
const SPECTATOR_JOINABLE_STATUSES: BattleStatus[] = ['published', 'lobby', 'live', 'completed'];
const ADMIN_JOINABLE_STATUSES: BattleStatus[] = ['draft', 'published', 'lobby', 'live'];
const PUBLIC_STATUSES: BattleStatus[] = ['published', 'lobby', 'live', 'completed'];

const ROLE_PRIORITY: Record<BattleParticipantRole, number> = {
  spectator: 0,
  player: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

const getRolePriority = (role: BattleParticipantRole | null | undefined): number =>
  role ? ROLE_PRIORITY[role] ?? -1 : -1;

const hasRoleAtLeast = (role: BattleParticipantRole | null | undefined, minimum: BattleParticipantRole): boolean =>
  getRolePriority(role) >= ROLE_PRIORITY[minimum];

const isPublicBattle = (status: BattleStatus): boolean => PUBLIC_STATUSES.includes(status);

const canRoleJoinBattle = (status: BattleStatus, role: BattleParticipantRole): boolean => {
  if (role === 'owner') {
    return true;
  }

  if (role === 'admin' || role === 'editor') {
    return ADMIN_JOINABLE_STATUSES.includes(status);
  }

  if (role === 'spectator') {
    return SPECTATOR_JOINABLE_STATUSES.includes(status);
  }

  return PLAYER_JOINABLE_STATUSES.includes(status);
};

const toBattleRecord = (row: DbBattleRow): BattleRecord => ({
  id: row.id,
  name: row.name,
  shortDescription: row.short_description,
  status: row.status,
  configuration: row.configuration ?? {},
  autoStart: row.auto_start,
  scheduledStartAt: row.scheduled_start_at ? row.scheduled_start_at.toISOString() : null,
  startedAt: row.started_at ? row.started_at.toISOString() : null,
  ownerId: row.owner_id,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const toBattleParticipantRecord = (row: DbBattleParticipantRow): BattleParticipantRecord => ({
  id: row.id,
  battleId: row.battle_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.created_at.toISOString(),
});

const isOwner = (battle: DbBattleRow, userId: string): boolean => battle.owner_id === userId;

const resolveParticipantRole = async (
  battle: DbBattleRow,
  userId: string,
): Promise<BattleParticipantRole | null> => {
  if (isOwner(battle, userId)) {
    return 'owner';
  }

  const participant = await findBattleParticipant(battle.id, userId);
  return participant?.role ?? null;
};

const ensureUserHasRole = async (
  battle: DbBattleRow,
  userId: string,
  minimumRole: BattleParticipantRole,
  errorMessage: string,
): Promise<void> => {
  if (isOwner(battle, userId)) {
    return;
  }

  const role = await resolveParticipantRole(battle, userId);
  if (!role || !hasRoleAtLeast(role, minimumRole)) {
    throw createHttpError(403, errorMessage);
  }
};

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
        status: 'live',
        autoStart: false,
        scheduledStartAt: null,
        startedAt: new Date(),
      };
    }

    return {
      status: 'published',
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
    if (explicitStatus === 'live') {
      return {
        status: 'live',
        autoStart: false,
        scheduledStartAt: null,
        startedAt: existing.started_at ?? new Date(),
      };
    }

    const plannedStart = startMode === 'scheduled' ? scheduledStartAt ?? existing.scheduled_start_at : null;
    return {
      status: explicitStatus,
      autoStart: startMode === 'scheduled',
      scheduledStartAt: startMode === 'scheduled' ? plannedStart : null,
      startedAt: existing.started_at,
    };
  }

  if (startMode === 'scheduled' && scheduledStartAt) {
    if (scheduledStartAt.getTime() <= Date.now()) {
      return {
        status: 'live',
        autoStart: false,
        scheduledStartAt: null,
        startedAt: new Date(),
      };
    }

    return {
      status: existing.status === 'draft' ? 'published' : existing.status,
      autoStart: true,
      scheduledStartAt,
      startedAt: existing.started_at,
    };
  }

  return {
    status: existing.status,
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

export const getBattles = async (requestingUserId?: string): Promise<BattleRecord[]> => {
  const rows = await listBattles();

  if (!requestingUserId) {
    return rows.filter((row) => isPublicBattle(row.status)).map(toBattleRecord);
  }

  const participantRows = await listBattleParticipantsByUser(requestingUserId);
  const roleByBattleId = new Map<string, BattleParticipantRole>();
  participantRows.forEach((participant) => {
    roleByBattleId.set(participant.battle_id, participant.role);
  });

  return rows
    .filter((row) => {
      if (row.owner_id === requestingUserId) {
        return true;
      }

      if (isPublicBattle(row.status)) {
        return true;
      }

      const role = roleByBattleId.get(row.id) ?? null;
      return role ? hasRoleAtLeast(role, 'editor') : false;
    })
    .map(toBattleRecord);
};

export const getBattleById = async (id: string, requestingUserId?: string): Promise<BattleRecord> => {
  const row = await findBattleById(id);
  if (!row) {
    throw createHttpError(404, 'Battle not found');
  }

  if (!requestingUserId) {
    if (!isPublicBattle(row.status)) {
      throw createHttpError(404, 'Battle not found');
    }
  } else if (!isOwner(row, requestingUserId)) {
    if (!isPublicBattle(row.status)) {
      const role = await resolveParticipantRole(row, requestingUserId);
      if (!role || !hasRoleAtLeast(role, 'editor')) {
        throw createHttpError(404, 'Battle not found');
      }
    }
  }

  return toBattleRecord(row);
};

export const createBattle = async (input: CreateBattleInput): Promise<BattleRecord> => {
  const name = sanitizeName(input.name);
  const shortDescription = normalizeShortDescription(input.shortDescription);
  const configuration = input.configuration ?? {};

  const plan = determineStartPlan(input.startMode, input.scheduledStartAt ?? null);
  const battleId = uuid();

  const created = await insertBattle({
    id: battleId,
    name,
    shortDescription: shortDescription ?? null,
    status: plan.status,
    configuration,
    autoStart: plan.autoStart,
    scheduledStartAt: plan.scheduledStartAt,
    startedAt: plan.startedAt,
    ownerId: input.ownerId,
  });

  await insertBattleParticipant({
    id: uuid(),
    battleId,
    userId: input.ownerId,
    role: 'owner',
  });

  if (created.auto_start && created.scheduled_start_at) {
    scheduler.schedule(created, (battleIdToStart) => startBattle(battleIdToStart));
  }

  return toBattleRecord(created);
};

export const updateBattle = async (id: string, userId: string, input: UpdateBattleInput): Promise<BattleRecord> => {
  const existing = await findBattleById(id);
  if (!existing) {
    throw createHttpError(404, 'Battle not found');
  }

  const isConfigUpdate =
    input.name !== undefined || input.shortDescription !== undefined || input.configuration !== undefined;

  if (isConfigUpdate && !CONFIGURABLE_STATUSES.includes(existing.status)) {
    throw createHttpError(409, `Battles in status "${existing.status}" cannot be configured`);
  }

  await ensureUserHasRole(existing, userId, 'editor', 'Editor access is required to configure battles');

  if (input.status) {
    if (input.status === 'live') {
      throw createHttpError(409, 'Battles cannot be set to live via configuration');
    }

    if (input.status === 'lobby') {
      if (existing.status !== 'published') {
        throw createHttpError(409, `Battles in status "${existing.status}" cannot enter the lobby`);
      }

      await ensureUserHasRole(existing, userId, 'admin', 'Only admins or owners can open the lobby');
    }

    if (input.status === 'completed') {
      if (existing.status !== 'live') {
        throw createHttpError(409, `Battles in status "${existing.status}" cannot be completed`);
      }

      await ensureUserHasRole(existing, userId, 'admin', 'Only admins or owners can complete battles');
    }

    if (input.status === 'draft' && existing.status !== 'draft' && existing.status !== 'published') {
      throw createHttpError(409, `Battles in status "${existing.status}" cannot return to draft`);
    }

    if (input.status === 'published' && existing.status === 'completed') {
      throw createHttpError(409, 'Completed battles cannot be republished');
    }
  }

  const startMode = input.startMode ?? (existing.auto_start ? 'scheduled' : 'manual');
  const shortDescription = normalizeShortDescription(input.shortDescription ?? undefined);
  const configuration = input.configuration ?? existing.configuration ?? {};
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
    updates.configuration = configuration;
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

  if (record.status === 'lobby' && existing.status !== 'lobby') {
    battleEvents.emit('battle.lobby-opened', record);
  }

  return record;
};

export const joinBattle = async (input: JoinBattleInput): Promise<JoinBattleResult> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  const existingParticipant = await findBattleParticipant(input.battleId, input.userId);
  if (existingParticipant) {
    return {
      participant: toBattleParticipantRecord(existingParticipant),
      wasCreated: false,
    };
  }

  const isBattleOwner = isOwner(battle, input.userId);

  let desiredRole: BattleParticipantRole = DEFAULT_PARTICIPANT_ROLE;

  if (isBattleOwner) {
    desiredRole = 'owner';
  } else if (input.role === 'owner') {
    throw createHttpError(403, 'Only the battle owner may join as owner');
  } else if (input.role === 'admin' || input.role === 'editor') {
    throw createHttpError(403, 'Elevated roles must be assigned by a battle owner or admin');
  } else if (input.role) {
    desiredRole = input.role;
  }

  if (!canRoleJoinBattle(battle.status, desiredRole)) {
    const suffix = desiredRole !== 'player' ? ` as ${desiredRole}` : '';
    throw createHttpError(409, `Battle cannot be joined while in status "${battle.status}"${suffix}`);
  }

  if (desiredRole === 'owner') {
    const existingOwner = await findBattleParticipantByRole(input.battleId, 'owner');
    if (existingOwner && existingOwner.user_id !== input.userId) {
      throw createHttpError(409, 'Battle already has an owner assigned');
    }
  }

  const participantRow = await insertBattleParticipant({
    id: uuid(),
    battleId: input.battleId,
    userId: input.userId,
    role: desiredRole,
  });

  const participant = toBattleParticipantRecord(participantRow);
  battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

  return { participant, wasCreated: true };
};

export const assignBattleRole = async (input: AssignBattleRoleInput): Promise<BattleParticipantRecord> => {
  const battle = await findBattleById(input.battleId);
  if (!battle) {
    throw createHttpError(404, 'Battle not found');
  }

  await ensureUserHasRole(battle, input.actorUserId, 'admin', 'Only owners or admins can manage battle roles');

  if (isOwner(battle, input.targetUserId)) {
    throw createHttpError(400, 'The battle owner role cannot be reassigned');
  }

  const desiredRole = input.role;

  if (!canRoleJoinBattle(battle.status, desiredRole)) {
    const suffix = desiredRole !== 'player' ? ` as ${desiredRole}` : '';
    throw createHttpError(409, `Battle cannot assign role while in status "${battle.status}"${suffix}`);
  }

  const existingParticipant = await findBattleParticipant(input.battleId, input.targetUserId);

  if (!existingParticipant) {
    const participantRow = await insertBattleParticipant({
      id: uuid(),
      battleId: input.battleId,
      userId: input.targetUserId,
      role: desiredRole,
    });

    const participant = toBattleParticipantRecord(participantRow);
    battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });
    return participant;
  }

  if (existingParticipant.role === desiredRole) {
    return toBattleParticipantRecord(existingParticipant);
  }

  if (existingParticipant.role === 'owner') {
    throw createHttpError(400, 'The battle owner role cannot be reassigned');
  }

  const updated = await updateBattleParticipantRole(input.battleId, input.targetUserId, desiredRole);
  if (!updated) {
    throw createHttpError(404, 'Participant not found');
  }

  return toBattleParticipantRecord(updated);
};

export const startBattle = async (id: string, userId?: string): Promise<BattleRecord> => {
  const existing = await findBattleById(id);
  if (!existing) {
    throw createHttpError(404, 'Battle not found');
  }

  if (existing.status !== 'published' && existing.status !== 'lobby') {
    throw createHttpError(409, `Battle cannot be started from status "${existing.status}"`);
  }

  if (userId) {
    await ensureUserHasRole(existing, userId, 'admin', 'Only admins or owners can start battles');
  }

  scheduler.cancel(id);

  const updated = await updateBattleById(id, {
    status: 'live',
    autoStart: false,
    scheduledStartAt: null,
    startedAt: existing.started_at ?? new Date(),
  });

  if (!updated) {
    throw createHttpError(404, 'Battle not found');
  }

  return toBattleRecord(updated);
};

export const isConfigurableStatus = (status: BattleStatus): boolean => CONFIGURABLE_STATUSES.includes(status);
