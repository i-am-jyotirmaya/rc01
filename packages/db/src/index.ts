import { PrismaPostgresDatabase } from "./prisma/postgresDatabase.js";
import { PrismaSqliteDatabase } from "./prisma/sqliteDatabase.js";
import type { DatabaseClient } from "./databaseClient.js";
import type { DatabaseInitOptions } from "./types.js";

let client: DatabaseClient | null = null;

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
};

export const initDb = (options: DatabaseInitOptions = {}): DatabaseClient => {
  if (client) {
    return client;
  }

  const usePostgres = options.usePostgres ?? false;
  const databaseUrl = options.databaseUrl;

  if (!databaseUrl) {
    throw new Error(
      "Database URL is not configured. Provide databaseUrl or set DATABASE_URL.",
    );
  }

  process.env.DATABASE_PROVIDER = usePostgres ? "postgresql" : "sqlite";
  process.env.DATABASE_URL = databaseUrl;

  client = usePostgres
    ? new PrismaPostgresDatabase(databaseUrl)
    : new PrismaSqliteDatabase(databaseUrl);

  return client;
};

export const getDb = (): DatabaseClient => {
  if (!client) {
    throw new Error("Database has not been initialized. Call initDb first.");
  }

  return client;
};

export const setDatabaseClient = (
  customClient: DatabaseClient | null,
): void => {
  client = customClient;
};

export const closeDb = async (): Promise<void> => {
  if (client) {
    await client.disconnect();
    client = null;
  }
};

export const runCoreMigrations = async (): Promise<void> => {
  await getDb().runMigrations();
};

export * from "./types.js";
export * from "./users.js";
export * from "./battles.js";
export * from "./battleParticipants.js";
export * from "./battleInvites.js";
