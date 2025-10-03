import path from 'node:path';
import bcrypt from 'bcryptjs';
import createHttpError from 'http-errors';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { insertUser, findUserByUsername, type DbUserRow } from '@codebattle/db';
import { env } from '../config/env';
import { ensureDirectory } from '../utils/filesystem';
import { signAuthToken } from '../utils/tokens';

type RegisterInput = {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  photo?: {
    buffer: Buffer;
    mimetype: string;
  };
};

type LoginInput = {
  username: string;
  password: string;
};

export type PublicUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoPath: string | null;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};

const toPublicUser = (user: DbUserRow): PublicUser => ({
  id: user.id,
  username: user.username,
  firstName: user.first_name,
  lastName: user.last_name,
  photoPath: user.photo_path,
  createdAt: user.created_at.toISOString(),
});

const saveProfilePhoto = async (photo: NonNullable<RegisterInput['photo']>): Promise<string> => {
  await ensureDirectory(env.uploadsDir);
  const fileId = uuid();
  const extension = photo.mimetype === 'image/png' ? 'png' : 'jpg';
  const fileName = `${fileId}.${extension}`;
  const filePath = path.join(env.uploadsDir, fileName);

  const transformer = sharp(photo.buffer).rotate();
  transformer.resize({
    width: env.imageMaxWidth,
    height: env.imageMaxWidth,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (extension === 'png') {
    await transformer.png({ compressionLevel: 9 }).toFile(filePath);
  } else {
    await transformer.jpeg({ quality: 80 }).toFile(filePath);
  }

  return `uploads/${fileName}`;
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const existing = await findUserByUsername(input.username);
  if (existing) {
    throw createHttpError(409, 'Username is already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const photoPath = input.photo ? await saveProfilePhoto(input.photo) : null;
  const userId = uuid();

  const createdUser = await insertUser({
    id: userId,
    username: input.username,
    firstName: input.firstName,
    lastName: input.lastName,
    passwordHash,
    photoPath,
  });

  const token = signAuthToken({ sub: createdUser.id, username: createdUser.username });
  return { token, user: toPublicUser(createdUser) };
};

export const authenticateUser = async (input: LoginInput): Promise<AuthResponse> => {
  const existing = await findUserByUsername(input.username);

  if (!existing) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(input.password, existing.password_hash);
  if (!isMatch) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const token = signAuthToken({ sub: existing.id, username: existing.username });
  return { token, user: toPublicUser(existing) };
};
