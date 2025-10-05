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
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (status IN ('draft', 'published', 'lobby', 'live', 'completed'))
      );
    `);

    await client.query(
      "ALTER TABLE battles ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE",
    );
    await client.query("CREATE INDEX IF NOT EXISTS idx_battles_owner ON battles (owner_id);");
    await client.query("ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_status_check;");
    await client.query(
      "ALTER TABLE battles ADD CONSTRAINT battles_status_check CHECK (status IN ('draft', 'published', 'lobby', 'live', 'completed'))",
    );

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
        CHECK (role IN ('owner', 'admin', 'editor', 'player', 'spectator')),
        UNIQUE (battle_id, user_id)
      );
    `);
    await client.query(
      "ALTER TABLE battle_participants DROP CONSTRAINT IF EXISTS battle_participants_role_check;",
    );
    await client.query(
      "ALTER TABLE battle_participants ADD CONSTRAINT battle_participants_role_check CHECK (role IN ('owner', 'admin', 'editor', 'player', 'spectator'))",
    );
    await client.query("DROP INDEX IF EXISTS idx_battle_participants_host;");
    await client.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participants_owner ON battle_participants (battle_id) WHERE role = 'owner';",
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
