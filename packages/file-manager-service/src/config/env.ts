import path from 'node:path';
import { config } from 'dotenv';

config();

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseSize = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.FILE_MANAGER_PORT, 4100),
  storageRoot:
    process.env.PROBLEM_STORAGE_ROOT ?? path.resolve(process.cwd(), 'problems'),
  maxProblemSizeMb: parseSize(process.env.FILE_MANAGER_MAX_SIZE_MB, 2),
};
