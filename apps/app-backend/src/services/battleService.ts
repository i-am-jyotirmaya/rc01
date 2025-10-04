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
  type BattleStatus,
  type DbBattleRow,
  type UpdateBattlePayload,
  type DbBattleParticipantRow,
  type BattleParticipantRole,
} from '@codebattle/db';
import { logger } from '../utils/logger';

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

const CONFIGURABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled'];
const DEFAULT_PARTICIPANT_ROLE: BattleParticipantRole = 'player';
const PLAYER_JOINABLE_STATUSES: BattleStatus[] = ['lobby', 'active'];
const ADMIN_JOINABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled', 'lobby', 'active'];

const normalizeParticipantRole = (role?: BattleParticipantRole): BattleParticipantRole => role ?? DEFAULT_PARTICIPANT_ROLE;

const canRoleJoinBattle = (status: BattleStatus, role: BattleParticipantRole): boolean => {
  if (role === 'host') {
    return ADMIN_JOINABLE_STATUSES.includes(status);
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
    scheduledBattles.forEach((battle) => {
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

  const normalizedRole = normalizeParticipantRole(input.role);
  const existingParticipant = await findBattleParticipant(input.battleId, input.userId);

  if (existingParticipant) {
    return {
      participant: toBattleParticipantRecord(existingParticipant),
      wasCreated: false,
    };
  }

  if (!canRoleJoinBattle(battle.status, normalizedRole)) {
    const suffix = normalizedRole === 'host' ? ' as host' : '';
    throw createHttpError(409, `Battle cannot be joined while in status "${battle.status}"${suffix}`);
  }

  if (normalizedRole === 'host') {
    const existingHost = await findBattleParticipantByRole(input.battleId, 'host');
    if (existingHost && existingHost.user_id !== input.userId) {
      throw createHttpError(409, 'Battle already has a host assigned');
    }
  }

  const participantRow = await insertBattleParticipant({
    id: uuid(),
    battleId: input.battleId,
    userId: input.userId,
    role: normalizedRole,
  });

  const participant = toBattleParticipantRecord(participantRow);
  battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

  return { participant, wasCreated: true };
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

  return toBattleRecord(updated);
};

export const isConfigurableStatus = (status: BattleStatus): boolean => CONFIGURABLE_STATUSES.includes(status);
