import { getDb } from './index.js';
import type { CreateUserPayload, DbUserRow } from './types.js';

export type { CreateUserPayload, DbUserRow } from './types.js';

export const insertUser = async (payload: CreateUserPayload): Promise<DbUserRow> => {
  return getDb().users.insert(payload);
};

export const findUserByUsername = async (username: string): Promise<DbUserRow | null> => {
  return getDb().users.findByUsername(username);
};

export const findUserByEmail = async (email: string): Promise<DbUserRow | null> => {
  return getDb().users.findByEmail(email);
};

export const findUserById = async (id: string): Promise<DbUserRow | null> => {
  return getDb().users.findById(id);
};
