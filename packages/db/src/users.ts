import type { QueryResult } from 'pg';
import { getPool } from './index';

export type DbUserRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  photo_path: string;
  created_at: Date;
};

export type CreateUserPayload = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  photoPath: string;
};

export const insertUser = async (payload: CreateUserPayload): Promise<DbUserRow> => {
  const pool = getPool();
  const result: QueryResult<DbUserRow> = await pool.query(
    `
    INSERT INTO users (id, username, first_name, last_name, password_hash, photo_path)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
    [payload.id, payload.username, payload.firstName, payload.lastName, payload.passwordHash, payload.photoPath],
  );

  return result.rows[0];
};

export const findUserByUsername = async (username: string): Promise<DbUserRow | null> => {
  const pool = getPool();
  const result: QueryResult<DbUserRow> = await pool.query(
    `
    SELECT * FROM users
    WHERE username = $1
  `,
    [username],
  );

  return result.rows[0] ?? null;
};

export const findUserById = async (id: string): Promise<DbUserRow | null> => {
  const pool = getPool();
  const result: QueryResult<DbUserRow> = await pool.query(
    `
    SELECT * FROM users
    WHERE id = $1
  `,
    [id],
  );

  return result.rows[0] ?? null;
};
