import path from 'node:path';

import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    FILE_MANAGER_PORT: z.string().optional(),
    PROBLEM_STORAGE_ROOT: z.string().optional(),
    FILE_MANAGER_DATABASE_FILE: z.string().optional(),
    FILE_MANAGER_MAX_SIZE_MB: z.string().optional(),
    FILE_MANAGER_ADMIN_TOKEN: z
      .string({ required_error: 'FILE_MANAGER_ADMIN_TOKEN is required' })
      .min(1, 'FILE_MANAGER_ADMIN_TOKEN cannot be empty'),
  })
  .transform((value) => ({
    nodeEnv: value.NODE_ENV ?? 'development',
    port: Number.parseInt(value.FILE_MANAGER_PORT ?? '', 10),
    storageRoot: value.PROBLEM_STORAGE_ROOT ?? path.resolve(process.cwd(), 'problems'),
    databaseFile:
      value.FILE_MANAGER_DATABASE_FILE ??
      path.join(value.PROBLEM_STORAGE_ROOT ?? path.resolve(process.cwd(), 'problems'), 'file-manager.sqlite'),
    maxProblemSizeMb: Number.parseInt(value.FILE_MANAGER_MAX_SIZE_MB ?? '', 10),
    adminToken: value.FILE_MANAGER_ADMIN_TOKEN,
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration for file-manager service');
  // eslint-disable-next-line no-console
  console.error(parsed.error.format());
  process.exit(1);
}

const defaultPort = 4100;
const defaultMaxSizeMb = 2;

const normalizeNumber = (value: number, fallback: number): number => {
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const env = {
  nodeEnv: parsed.data.nodeEnv,
  port: normalizeNumber(parsed.data.port, defaultPort),
  storageRoot: parsed.data.storageRoot,
  databaseFile: parsed.data.databaseFile,
  maxProblemSizeMb: normalizeNumber(parsed.data.maxProblemSizeMb, defaultMaxSizeMb),
  adminToken: parsed.data.adminToken,
};
