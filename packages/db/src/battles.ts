import type { QueryResult } from 'pg';
import { getPool } from './index';

export type BattleStatus =
  | 'draft'
  | 'configuring'
  | 'scheduled'
  | 'ready'
  | 'active'
  | 'completed'
  | 'cancelled';

export type DbBattleRow = {
  id: string;
  name: string;
  short_description: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  auto_start: boolean;
  scheduled_start_at: Date | null;
  started_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CreateBattlePayload = {
  id: string;
  name: string;
  shortDescription?: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt?: Date | null;
  startedAt?: Date | null;
};

export type UpdateBattlePayload = Partial<{
  name: string;
  shortDescription: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
}>;

const columnMap: Record<keyof UpdateBattlePayload, string> = {
  name: 'name',
  shortDescription: 'short_description',
  status: 'status',
  configuration: 'configuration',
  autoStart: 'auto_start',
  scheduledStartAt: 'scheduled_start_at',
  startedAt: 'started_at',
};

export const insertBattle = async (payload: CreateBattlePayload): Promise<DbBattleRow> => {
  const pool = getPool();
  const result: QueryResult<DbBattleRow> = await pool.query(
    `
      INSERT INTO battles (
        id,
        name,
        short_description,
        status,
        configuration,
        auto_start,
        scheduled_start_at,
        started_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.id,
      payload.name,
      payload.shortDescription ?? null,
      payload.status,
      payload.configuration,
      payload.autoStart,
      payload.scheduledStartAt ?? null,
      payload.startedAt ?? null,
    ],
  );

  return result.rows[0];
};

export const listBattles = async (): Promise<DbBattleRow[]> => {
  const pool = getPool();
  const result: QueryResult<DbBattleRow> = await pool.query(
    `
      SELECT *
      FROM battles
      ORDER BY created_at DESC
    `,
  );

  return result.rows;
};

export const findBattleById = async (id: string): Promise<DbBattleRow | null> => {
  const pool = getPool();
  const result: QueryResult<DbBattleRow> = await pool.query(
    `
      SELECT *
      FROM battles
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

export const listScheduledBattles = async (): Promise<DbBattleRow[]> => {
  const pool = getPool();
  const result: QueryResult<DbBattleRow> = await pool.query(
    `
      SELECT *
      FROM battles
      WHERE status = 'scheduled'
      ORDER BY scheduled_start_at ASC NULLS LAST
    `,
  );

  return result.rows;
};

export const updateBattleById = async (id: string, payload: UpdateBattlePayload): Promise<DbBattleRow | null> => {
  const entries = (Object.entries(payload) as [keyof UpdateBattlePayload, unknown][]).filter(
    ([, value]) => value !== undefined,
  );

  const assignments: string[] = entries.map(([key], index) => `${columnMap[key]} = $${index + 1}`);
  const values = entries.map(([, value]) => value);

  const setClause = assignments.length > 0 ? `${assignments.join(', ')}, ` : '';

  const pool = getPool();
  const result: QueryResult<DbBattleRow> = await pool.query(
    `
      UPDATE battles
      SET ${setClause}updated_at = NOW()
      WHERE id = $${assignments.length + 1}
      RETURNING *
    `,
    [...values, id],
  );

  return result.rows[0] ?? null;
};
