import { closeDb, initDb, runCoreMigrations, setDatabaseClient } from '@rc01/db';

const generateInMemoryDatabaseUrl = (): string => 'file:memory:?cache=shared';

export const setupTestDatabase = async (): Promise<void> => {
  initDb({ usePostgres: false, databaseUrl: generateInMemoryDatabaseUrl() });
  await runCoreMigrations();
};

export const teardownTestDatabase = async (): Promise<void> => {
  await closeDb();
  setDatabaseClient(null);
};
