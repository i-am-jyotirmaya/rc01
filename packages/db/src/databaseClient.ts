import type {
  BattleParticipantRole,
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
} from './types.js';

export type DatabaseKind = 'postgres' | 'sqlite';

export interface UsersRepository {
  insert(payload: CreateUserPayload): Promise<DbUserRow>;
  findByUsername(username: string): Promise<DbUserRow | null>;
  findByEmail(email: string): Promise<DbUserRow | null>;
  findById(id: string): Promise<DbUserRow | null>;
}

export interface BattlesRepository {
  insert(payload: CreateBattlePayload): Promise<DbBattleRow>;
  list(): Promise<DbBattleRow[]>;
  listScheduled(): Promise<DbBattleRow[]>;
  findById(id: string): Promise<DbBattleRow | null>;
  updateById(id: string, payload: UpdateBattlePayload): Promise<DbBattleRow | null>;
}

export interface BattleParticipantsRepository {
  insert(payload: CreateBattleParticipantPayload): Promise<DbBattleParticipantRow>;
  find(battleId: string, userId: string): Promise<DbBattleParticipantRow | null>;
  findByRole(battleId: string, role: BattleParticipantRole): Promise<DbBattleParticipantRow | null>;
  listByBattle(battleId: string): Promise<DbBattleParticipantRow[]>;
  updateById(id: string, payload: UpdateBattleParticipantPayload): Promise<DbBattleParticipantRow>;
}

export interface BattleInvitesRepository {
  insert(payload: CreateBattleInvitePayload): Promise<DbBattleInviteRow>;
  findByToken(token: string): Promise<DbBattleInviteRow | null>;
  listByBattle(battleId: string): Promise<DbBattleInviteRow[]>;
  updateById(id: string, payload: UpdateBattleInvitePayload): Promise<DbBattleInviteRow>;
}

export interface DatabaseClient {
  readonly kind: DatabaseKind;
  readonly users: UsersRepository;
  readonly battles: BattlesRepository;
  readonly battleParticipants: BattleParticipantsRepository;
  readonly battleInvites: BattleInvitesRepository;
  runMigrations(): Promise<void>;
  disconnect(): Promise<void>;
}
