import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export const initDb = (config: PoolConfig): Pool => {
  if (!pool) {
    pool = new Pool(config);
  }

  return pool;
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDb first.');
  }

  return pool;
};

export const closeDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const runCoreMigrations = async (): Promise<void> => {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        password_hash TEXT NOT NULL,
        photo_path TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export * from './users';
