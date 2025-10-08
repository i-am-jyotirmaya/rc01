import { closeDb, initDb, runCoreMigrations, setDatabaseClient } from '@rc01/db';

export const setupTestDatabase = async (): Promise<void> => {
  initDb({ usePostgres: false, databaseUrl: 'file:memory:?cache=shared' });
  await runCoreMigrations();
};

export const teardownTestDatabase = async (): Promise<void> => {
  await closeDb();
  setDatabaseClient(null);
};
