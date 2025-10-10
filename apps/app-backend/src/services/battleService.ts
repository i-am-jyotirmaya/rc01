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
  updateBattleParticipantById,
  type BattleStatus,
  type DbBattleRow,
  type UpdateBattlePayload,
  type DbBattleParticipantRow,
  type BattleParticipantRole,
  type BattleParticipantStatus,
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
  'battle.participant-joined': [{ battleId: string; participant: BattleParticipantRecord }];
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
};

export type JoinBattleResult = {
  participant: BattleParticipantRecord;
  wasCreated: boolean;
};

const CONFIGURABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled'];
const DEFAULT_PARTICIPANT_ROLE: BattleParticipantRole = 'player';
const PLAYER_JOINABLE_STATUSES: BattleStatus[] = ['lobby', 'active'];
const MANAGEMENT_JOINABLE_STATUSES: BattleStatus[] = ['draft', 'configuring', 'ready', 'scheduled', 'lobby', 'active'];
const ACCEPTED_PARTICIPANT_STATUS: BattleParticipantStatus = 'accepted';
const PENDING_PARTICIPANT_STATUS: BattleParticipantStatus = 'pending';

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
  player: ['battle.view', 'battle.play', 'battle.submitSolution', 'battle.viewSubmissions'],
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
  status: row.status,
  permissions: getPermissionsForRole(row.role),
  invitedAt: row.created_at.toISOString(),
  joinedAt: row.accepted_at ? row.accepted_at.toISOString() : null,
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

  const ownerParticipant = await insertBattleParticipant({
    id: uuid(),
    battleId,
    userId: input.createdByUserId,
    role: 'owner',
    status: ACCEPTED_PARTICIPANT_STATUS,
    acceptedAt: new Date(),
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

  const existingParticipant = await findBattleParticipant(input.battleId, input.userId);

  if (existingParticipant) {
    if (existingParticipant.status === PENDING_PARTICIPANT_STATUS) {
      const accepted = await updateBattleParticipantById(existingParticipant.id, {
        status: ACCEPTED_PARTICIPANT_STATUS,
        acceptedAt: new Date(),
      });

      const participant = toBattleParticipantRecord(accepted);
      battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

      return { participant, wasCreated: false };
    }

    return {
      participant: toBattleParticipantRecord(existingParticipant),
      wasCreated: false,
    };
  }

  const normalizedRole = normalizeParticipantRole(input.role);

  if (normalizedRole !== 'player') {
    throw createHttpError(403, `Only invited users can join with the "${normalizedRole}" role`);
  }

  if (!canRoleJoinBattle(battle.status, normalizedRole)) {
    throw createHttpError(409, `Battle cannot be joined while in status "${battle.status}"`);
  }

  const participantRow = await insertBattleParticipant({
    id: uuid(),
    battleId: input.battleId,
    userId: input.userId,
    role: normalizedRole,
    status: ACCEPTED_PARTICIPANT_STATUS,
    acceptedAt: new Date(),
  });

  const participant = toBattleParticipantRecord(participantRow);
  battleEvents.emit('battle.participant-joined', { battleId: input.battleId, participant });

  return { participant, wasCreated: true };
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

  if (input.role === 'owner') {
    throw createHttpError(400, 'Owner role cannot be reassigned through invitations');
  }

  const existingInvitee = await findBattleParticipant(input.battleId, input.inviteeUserId);

  if (existingInvitee) {
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

  return toBattleRecord(updated);
};

export const isConfigurableStatus = (status: BattleStatus): boolean => CONFIGURABLE_STATUSES.includes(status);
