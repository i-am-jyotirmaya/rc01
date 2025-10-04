import { Router, type NextFunction, type Request, type Response } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';

import { createProblemSchema, type CreateProblemInput, ProblemStore } from '../services/problemStore';
import { sanitizeSlug } from '../utils/files';

const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .transform((value) => sanitizeSlug(value))
    .refine((value) => value.length > 0, {
      message: 'Slug must contain at least one alphanumeric character',
    }),
});

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
        const { slug } = slugParamSchema.parse(req.params);
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
        const parsedBody = createProblemSchema.parse(req.body);
        const problem = await store.save(parsedBody);
        res.status(201).json(problem);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:slug',
    async (
      req: Request<{ slug: string }>,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const { slug } = slugParamSchema.parse(req.params);
        await store.delete(slug);
        res.status(204).send();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          next(createHttpError(404, 'Problem not found'));
          return;
        }

        next(error);
      }
    },
  );

  return router;
};
