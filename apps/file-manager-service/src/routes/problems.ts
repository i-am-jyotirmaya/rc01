import { Router, type NextFunction, type Request, type Response } from 'express';
import createHttpError from 'http-errors';
import multer from 'multer';
import { z } from 'zod';

import {
  type CreateProblemInput,
  FileManager,
  ProblemNotFoundError,
  ProblemTemplateValidationError,
  problemContentSchema,
  sanitizeSlug,
} from '@rc01/file-manager';

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

type ProblemRouterOptions = {
  maxProblemSizeMb: number;
};

const extractContentFromRequest = (req: Request): string | undefined => {
  if (req.file?.buffer) {
    return req.file.buffer.toString('utf-8');
  }

  const bodyContent = (req.body as Partial<CreateProblemInput>)?.content;
  if (typeof bodyContent === 'string') {
    return bodyContent;
  }

  return undefined;
};

export const createProblemRouter = (fileManager: FileManager, options: ProblemRouterOptions): Router => {
  const router = Router();
  const maxSizeBytes = Math.max(1, options.maxProblemSizeMb) * 1024 * 1024;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeBytes },
  });

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const problems = await fileManager.listProblems();
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
        const problem = await fileManager.getProblem(slug);
        res.json(problem);
      } catch (error) {
        if (error instanceof ProblemNotFoundError) {
          next(createHttpError(404, 'Problem not found'));
          return;
        }

        if (error instanceof ProblemTemplateValidationError) {
          next(createHttpError(422, error.message));
          return;
        }

        next(error);
      }
    },
  );

  router.post(
    '/',
    upload.single('file'),
    async (
      req: Request<Record<string, never>, unknown, Partial<CreateProblemInput>>,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const rawContent = extractContentFromRequest(req);
        if (!rawContent || !rawContent.trim()) {
          throw createHttpError(400, 'Problem content is required');
        }

        const parsedBody = problemContentSchema.parse({ content: rawContent });
        const problem = await fileManager.saveProblem(parsedBody);
        res.status(201).json(problem);
      } catch (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            next(createHttpError(413, 'Problem file exceeds maximum allowed size.'));
            return;
          }

          next(createHttpError(400, error.message));
          return;
        }

        if (error instanceof ProblemTemplateValidationError) {
          next(createHttpError(422, error.message));
          return;
        }

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
        await fileManager.deleteProblem(slug);
        res.status(204).send();
      } catch (error) {
        if (error instanceof ProblemNotFoundError) {
          next(createHttpError(404, 'Problem not found'));
          return;
        }

        next(error);
      }
    },
  );

  return router;
};
