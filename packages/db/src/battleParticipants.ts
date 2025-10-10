import { getDb } from './index.js';
import type {
  BattleParticipantRole,
  CreateBattleParticipantPayload,
  DbBattleParticipantRow,
  UpdateBattleParticipantPayload,
} from './types.js';

export type {
  BattleParticipantRole,
  CreateBattleParticipantPayload,
  DbBattleParticipantRow,
  UpdateBattleParticipantPayload,
} from './types.js';

export const insertBattleParticipant = async (
  payload: CreateBattleParticipantPayload,
): Promise<DbBattleParticipantRow> => {
  return getDb().battleParticipants.insert(payload);
};

export const findBattleParticipant = async (
  battleId: string,
  userId: string,
): Promise<DbBattleParticipantRow | null> => {
  return getDb().battleParticipants.find(battleId, userId);
};

export const findBattleParticipantByRole = async (
  battleId: string,
  role: BattleParticipantRole,
): Promise<DbBattleParticipantRow | null> => {
  return getDb().battleParticipants.findByRole(battleId, role);
};

export const listBattleParticipantsByBattle = async (
  battleId: string,
): Promise<DbBattleParticipantRow[]> => {
  return getDb().battleParticipants.listByBattle(battleId);
};

export const updateBattleParticipantById = async (
  id: string,
  payload: UpdateBattleParticipantPayload,
): Promise<DbBattleParticipantRow> => {
  return getDb().battleParticipants.updateById(id, payload);
};
