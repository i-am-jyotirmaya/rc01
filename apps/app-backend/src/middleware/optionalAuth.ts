import type { RequestHandler } from 'express';
import { findUserById } from '@rc01/db';
import { toPublicUser } from '../services/authService.js';
import { verifyAuthToken } from '../utils/tokens.js';

const extractBearerToken = (headerValue?: string): string | null => {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

export const attachOptionalUser: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req.header('Authorization'));

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);

    if (user) {
      req.user = toPublicUser(user);
    }
  } catch {
    // ignore invalid tokens; request proceeds without user context
  }

  next();
};
