import http from 'node:http';
import path from 'node:path';
import { initDb, runCoreMigrations } from '@rc01/db';
import { env } from './config/env.js';
import { app } from './app.js';
import { ensureDirectory } from './utils/filesystem.js';
import { logger } from './utils/logger.js';
import { initializeBattleScheduling } from './services/battleService.js';
import { initializeBattleRealtime } from './realtime/socketServer.js';

const parseBoolean = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const buildPostgresUrl = (): string => {
  const password = encodeURIComponent(env.database.password);
  return `postgresql://${env.database.user}:${password}@${env.database.host}:${env.database.port}/${env.database.name}`;
};

const startServer = async (): Promise<void> => {
  try {
    await ensureDirectory(env.storageDir);
    await ensureDirectory(env.uploadsDir);

    const usePostgres = parseBoolean(process.env.USE_POSTGRES);
    const sqlitePath = path.join(env.storageDir, 'codebattle.sqlite');
    const databaseUrl = usePostgres ? buildPostgresUrl() : `file:${sqlitePath}`;

    initDb({
      usePostgres,
      databaseUrl,
    });

    await runCoreMigrations();
    await initializeBattleScheduling();

    const server = http.createServer(app);
    initializeBattleRealtime(server);

    server.listen(env.port, () => {
      logger.info(`Backend listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start backend', error);
    process.exit(1);
  }
};

void startServer();
