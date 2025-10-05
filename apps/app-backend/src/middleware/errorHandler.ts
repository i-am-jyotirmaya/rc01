import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { logger } from '../utils/logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  let error = err;

  if (!createHttpError.isHttpError(error)) {
    logger.error('Unexpected error handled by middleware:', error);
    error = createHttpError(500, 'An unexpected error occurred');
  }

  const httpError = error as createHttpError.HttpError;

  res.status(httpError.status).json({
    statusCode: httpError.status,
    message: httpError.message,
    details: httpError.expose ? httpError : undefined,
  });
};
