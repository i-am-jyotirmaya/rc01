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
};

const storageDir = process.env.STORAGE_DIR ?? path.resolve(process.cwd(), 'storage');
const uploadsDir = path.join(storageDir, 'uploads');

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
};

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set. Falling back to insecure default value.');
}
