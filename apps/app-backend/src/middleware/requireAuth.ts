import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { resolveRequiredUser } from '../utils/authentication.js';

type HttpLikeError = { status?: number };

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.user = await resolveRequiredUser(req);
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
