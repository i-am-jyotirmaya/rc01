import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import createHttpError, { isHttpError } from 'http-errors';
import type { HttpError } from 'http-errors';
import { env } from './config/env';
import { ensureDirectory } from './utils/files';
import { ProblemStore } from './services/problemStore';
import { createProblemRouter } from './routes/problems';

export const createServer = async (): Promise<Express> => {
  await ensureDirectory(env.storageRoot);

  const app = express();
  const store = new ProblemStore(env.storageRoot);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: `${env.maxProblemSizeMb}mb` }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/problems', createProblemRouter(store));

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(createHttpError(404, 'Route not found'));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
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
