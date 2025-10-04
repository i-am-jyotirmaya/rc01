import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { findUserById } from '@codebattle/db';
import { toPublicUser } from '../services/authService';
import { verifyAuthToken } from '../utils/tokens';

type HttpLikeError = { status?: number };

const extractBearerToken = (headerValue: string | undefined): string | null => {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.header('Authorization'));

    if (!token) {
      throw createHttpError(401, 'Authentication required');
    }

    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      throw createHttpError(401, 'Invalid authentication token');
    }

    req.user = toPublicUser(user);
    next();
  } catch (error) {
    const status = (error as HttpLikeError)?.status;
    if (typeof status === 'number') {
      next(error);
      return;
    }

    next(createHttpError(401, 'Invalid authentication token'));
  }
};
