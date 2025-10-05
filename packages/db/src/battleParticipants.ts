import type { QueryResult } from 'pg';
import { getPool } from './index.js';

export type BattleParticipantRole = 'host' | 'player' | 'spectator';

export type DbBattleParticipantRow = {
  id: string;
  battle_id: string;
  user_id: string;
  role: BattleParticipantRole;
  created_at: Date;
};

export type CreateBattleParticipantPayload = {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
};

export const insertBattleParticipant = async (
  payload: CreateBattleParticipantPayload,
): Promise<DbBattleParticipantRow> => {
  const pool = getPool();
  const result: QueryResult<DbBattleParticipantRow> = await pool.query(
    `
      INSERT INTO battle_participants (
        id,
        battle_id,
        user_id,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [payload.id, payload.battleId, payload.userId, payload.role],
  );

  return result.rows[0];
};

export const findBattleParticipant = async (
  battleId: string,
  userId: string,
): Promise<DbBattleParticipantRow | null> => {
  const pool = getPool();
  const result: QueryResult<DbBattleParticipantRow> = await pool.query(
    `
      SELECT *
      FROM battle_participants
      WHERE battle_id = $1 AND user_id = $2
    `,
    [battleId, userId],
  );

  return result.rows[0] ?? null;
};

export const findBattleParticipantByRole = async (
  battleId: string,
  role: BattleParticipantRole,
): Promise<DbBattleParticipantRow | null> => {
  const pool = getPool();
  const result: QueryResult<DbBattleParticipantRow> = await pool.query(
    `
      SELECT *
      FROM battle_participants
      WHERE battle_id = $1 AND role = $2
    `,
    [battleId, role],
  );

  return result.rows[0] ?? null;
};

export const listBattleParticipantsByBattle = async (
  battleId: string,
): Promise<DbBattleParticipantRow[]> => {
  const pool = getPool();
  const result: QueryResult<DbBattleParticipantRow> = await pool.query(
    `
      SELECT *
      FROM battle_participants
      WHERE battle_id = $1
      ORDER BY created_at ASC
    `,
    [battleId],
  );

  return result.rows;
};
