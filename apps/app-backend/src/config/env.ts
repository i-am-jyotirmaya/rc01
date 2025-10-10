import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export type AppEnvironment = {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  storageDir: string;
  uploadsDir: string;
  maxUploadSizeMb: number;
  imageMaxWidth: number;
  externalServices: {
    fileManager: {
      mode: 'service' | 'package';
      baseUrl: string;
      adminToken: string;
      storageRoot: string;
      databaseFile: string;
    };
  };
};

const storageDir = process.env.STORAGE_DIR ?? path.resolve(process.cwd(), 'storage');
const uploadsDir = path.join(storageDir, 'uploads');
const problemsDir = process.env.FILE_MANAGER_STORAGE_ROOT ?? path.join(storageDir, 'problems');

const parseFileManagerMode = (value: string | undefined): 'service' | 'package' => {
  return value === 'package' ? 'package' : 'service';
};

const normalizeBaseUrl = (value: string | undefined, fallback: string): string => {
  const input = (value ?? fallback).trim();
  return input.replace(/\/$/, '');
};

export const env: AppEnvironment = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  database: {
    host: process.env.DB_HOST ?? 'postgres',
    port: numberFromEnv(process.env.DB_PORT, 5432),
    user: process.env.DB_USER ?? 'codebattle',
    password: process.env.DB_PASSWORD ?? 'codebattle',
    name: process.env.DB_NAME ?? 'codebattle',
  },
  storageDir,
  uploadsDir,
  maxUploadSizeMb: numberFromEnv(process.env.MAX_UPLOAD_SIZE_MB, 5),
  imageMaxWidth: numberFromEnv(process.env.IMAGE_MAX_WIDTH, 512),
  externalServices: {
    fileManager: {
      mode: parseFileManagerMode(process.env.FILE_MANAGER_MODE),
      baseUrl: normalizeBaseUrl(process.env.FILE_MANAGER_BASE_URL, 'http://localhost:4100'),
      adminToken: process.env.FILE_MANAGER_ADMIN_TOKEN ?? 'local-file-manager-admin',
      storageRoot: problemsDir,
      databaseFile:
        process.env.FILE_MANAGER_DATABASE_FILE ?? path.join(problemsDir, 'file-manager.sqlite'),
    },
  },
};

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set. Falling back to insecure default value.');
}
