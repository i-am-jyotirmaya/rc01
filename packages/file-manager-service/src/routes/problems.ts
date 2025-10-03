import { Router, type NextFunction, type Request, type Response } from 'express';
import createHttpError from 'http-errors';

import type { CreateProblemInput } from '../services/problemStore';
import { ProblemStore } from '../services/problemStore';

export const createProblemRouter = (store: ProblemStore): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const problems = await store.list();
      res.json({ problems });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/:slug',
    async (
      req: Request<{ slug: string }>,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const { slug } = req.params;
        const problem = await store.read(slug);
        res.json(problem);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          next(createHttpError(404, 'Problem not found'));
          return;
        }

        next(error);
      }
    },
  );

  router.post(
    '/',
    async (
      req: Request<unknown, unknown, CreateProblemInput>,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const problem = await store.save(req.body);
        res.status(201).json(problem);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
