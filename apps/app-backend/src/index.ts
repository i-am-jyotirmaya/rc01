import { initDb, runCoreMigrations } from '@rc01/db';
import { env } from './config/env.js';
import { app } from './app.js';
import { ensureDirectory } from './utils/filesystem.js';
import { logger } from './utils/logger.js';
import { initializeBattleScheduling } from './services/battleService.js';

const startServer = async (): Promise<void> => {
  try {
    await ensureDirectory(env.storageDir);
    await ensureDirectory(env.uploadsDir);

    initDb({
      host: env.database.host,
      port: env.database.port,
      user: env.database.user,
      password: env.database.password,
      database: env.database.name,
    });

    await runCoreMigrations();
    await initializeBattleScheduling();

    app.listen(env.port, () => {
      logger.info(`Backend listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start backend', error);
    process.exit(1);
  }
};

void startServer();
