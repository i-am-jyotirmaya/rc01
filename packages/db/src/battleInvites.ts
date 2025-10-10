import { getDb } from './index.js';
import type {
  CreateBattleInvitePayload,
  DbBattleInviteRow,
  UpdateBattleInvitePayload,
} from './types.js';

export type { CreateBattleInvitePayload, DbBattleInviteRow, UpdateBattleInvitePayload } from './types.js';

export const insertBattleInvite = async (payload: CreateBattleInvitePayload): Promise<DbBattleInviteRow> => {
  return getDb().battleInvites.insert(payload);
};

export const findBattleInviteByToken = async (token: string): Promise<DbBattleInviteRow | null> => {
  return getDb().battleInvites.findByToken(token);
};

export const listBattleInvitesByBattle = async (battleId: string): Promise<DbBattleInviteRow[]> => {
  return getDb().battleInvites.listByBattle(battleId);
};

export const updateBattleInviteById = async (
  id: string,
  payload: UpdateBattleInvitePayload,
): Promise<DbBattleInviteRow> => {
  return getDb().battleInvites.updateById(id, payload);
};
