import type { Pool } from 'pg';
import { newDb, type IMemoryDb } from 'pg-mem';
import { closeDb, runCoreMigrations, setPool } from '@codebattle/db';

export const setupTestDatabase = async (): Promise<{ db: IMemoryDb }> => {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool: MemPool } = db.adapters.createPg();
  const pool = new MemPool() as unknown as Pool;
  setPool(pool);
  await runCoreMigrations();
  return { db };
};

export const teardownTestDatabase = async (): Promise<void> => {
  await closeDb();
  setPool(null);
};
