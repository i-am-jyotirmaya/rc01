import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import multer from 'multer';
import { z } from 'zod';

import {
  createProblemFromContent,
  getProblem,
  listProblems,
  updateProblemFromContent,
  uploadProblemFile,
} from '../services/problemManagerService.js';

const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const problemUpload = multer({ storage: multer.memoryStorage() });

export const listProblemsHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const problems = await listProblems();
    res.json({ problems });
  } catch (error) {
    next(error);
  }
};

export const getProblemHandler = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { slug } = slugParamSchema.parse(req.params);
    const problem = await getProblem(slug);
    res.json({ problem });
  } catch (error) {
    next(error);
  }
};

const extractContent = (req: Request): string | null => {
  if (req.file?.buffer) {
    return req.file.buffer.toString('utf-8');
  }

  const bodyContent = (req.body as { content?: string })?.content;
  if (typeof bodyContent === 'string') {
    return bodyContent;
  }

  return null;
};

export const createProblemHandler = async (
  req: Request<Record<string, never>, unknown, { content?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.file) {
      const problem = await uploadProblemFile(req.file);
      res.status(201).json({ problem });
      return;
    }

    const content = extractContent(req);
    if (!content || !content.trim()) {
      throw createHttpError(400, 'Problem content is required');
    }

    const problem = await createProblemFromContent(content);
    res.status(201).json({ problem });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      next(createHttpError(400, error.message));
      return;
    }
    next(error);
  }
};

export const updateProblemHandler = async (
  req: Request<{ slug: string }, unknown, { content?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { slug } = slugParamSchema.parse(req.params);
    const content = extractContent(req);

    if (!content || !content.trim()) {
      throw createHttpError(400, 'Problem content is required');
    }

    const problem = await updateProblemFromContent(slug, content);
    res.json({ problem });
  } catch (error) {
    next(error);
  }
};
