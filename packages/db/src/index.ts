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

export const setPool = (customPool: Pool | null): void => {
  pool = customPool;
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        short_description TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'draft',
        configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
        auto_start BOOLEAN NOT NULL DEFAULT FALSE,
        scheduled_start_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (status IN ('draft', 'configuring', 'scheduled', 'ready', 'lobby', 'active', 'completed', 'cancelled'))
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status);');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_battles_scheduled_start ON battles (scheduled_start_at) WHERE scheduled_start_at IS NOT NULL;',
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS battle_participants (
        id UUID PRIMARY KEY,
        battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(16) NOT NULL DEFAULT 'player',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (role IN ('host', 'player', 'spectator')),
        UNIQUE (battle_id, user_id)
      );
    `);
    await client.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participants_host ON battle_participants (battle_id) WHERE role = 'host';",
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export * from './users.js';
export * from './battles.js';
export * from './battleParticipants.js';
