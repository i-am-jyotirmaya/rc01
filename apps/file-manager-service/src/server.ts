import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import createHttpError, { isHttpError } from 'http-errors';
import type { HttpError } from 'http-errors';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { createFileManager } from '@rc01/file-manager';

import { createProblemRouter } from './routes/problems.js';
import { requireAdmin } from './middleware/requireAdmin.js';

export const createServer = async (): Promise<Express> => {
  const app = express();
  const fileManager = await createFileManager({
    storageRoot: env.storageRoot,
    databaseFile: env.databaseFile,
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: `${env.maxProblemSizeMb}mb` }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/problems',
    requireAdmin(env.adminToken),
    createProblemRouter(fileManager, { maxProblemSizeMb: env.maxProblemSizeMb }),
  );

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(createHttpError(404, 'Route not found'));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Validation failed', errors: error.flatten() });
      return;
    }

    if (isHttpError(error)) {
      const httpError = error as HttpError;
      res.status(httpError.status).json({ message: httpError.message });
      return;
    }

    console.error('Unexpected error in file-manager service', error);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
};
