import type { Request } from 'express';
import createHttpError from 'http-errors';
import { findUserById } from '@rc01/db';
import { toPublicUser, type PublicUser } from '../services/authService.js';
import { verifyAuthToken } from './tokens.js';

export const extractBearerToken = (headerValue: string | undefined): string | null => {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

export const resolveOptionalUser = async (req: Request): Promise<PublicUser | null> => {
  const token = extractBearerToken(req.header('Authorization'));

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);
    return user ? toPublicUser(user) : null;
  } catch (error) {
    const httpError = error as { status?: number };
    if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
      throw createHttpError(401, 'Invalid authentication token');
    }

    return null;
  }
};

export const resolveRequiredUser = async (req: Request): Promise<PublicUser> => {
  const user = await resolveOptionalUser(req);

  if (!user) {
    throw createHttpError(401, 'Authentication required');
  }

  return user;
};

