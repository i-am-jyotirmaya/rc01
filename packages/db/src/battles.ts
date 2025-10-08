import { getDb } from './index.js';
import type {
  CreateBattlePayload,
  DbBattleRow,
  UpdateBattlePayload,
  BattleStatus,
} from './types.js';

export type { BattleStatus, CreateBattlePayload, DbBattleRow, UpdateBattlePayload } from './types.js';

export const insertBattle = async (payload: CreateBattlePayload): Promise<DbBattleRow> => {
  return getDb().battles.insert(payload);
};

export const listBattles = async (): Promise<DbBattleRow[]> => {
  return getDb().battles.list();
};

export const findBattleById = async (id: string): Promise<DbBattleRow | null> => {
  return getDb().battles.findById(id);
};

export const listScheduledBattles = async (): Promise<DbBattleRow[]> => {
  return getDb().battles.listScheduled();
};

export const updateBattleById = async (id: string, payload: UpdateBattlePayload): Promise<DbBattleRow | null> => {
  return getDb().battles.updateById(id, payload);
};
