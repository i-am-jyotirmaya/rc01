import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  sub: string;
  username: string;
};

const TOKEN_TTL = '1d';

export const signAuthToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL });
};
