import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

const extractBearerToken = (headerValue: string | undefined): string | undefined => {
  if (!headerValue) {
    return undefined;
  }

  const trimmed = headerValue.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }

  return trimmed;
};

export const requireAdmin = (adminToken: string) => {
  if (!adminToken) {
    throw new Error('Admin token must be configured for admin middleware');
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const headerToken = req.header('x-admin-token');
    const authorizationToken = extractBearerToken(req.header('authorization'));
    const providedToken = headerToken?.trim() || authorizationToken;

    if (!providedToken || providedToken !== adminToken) {
      next(createHttpError(401, 'Admin authentication required'));
      return;
    }

    next();
  };
};
