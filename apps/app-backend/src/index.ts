import { initDb, runCoreMigrations } from '@codebattle/db';
import { env } from './config/env';
import { app } from './app';
import { ensureDirectory } from './utils/filesystem';
import { logger } from './utils/logger';
import { initializeBattleScheduling } from './services/battleService';

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
