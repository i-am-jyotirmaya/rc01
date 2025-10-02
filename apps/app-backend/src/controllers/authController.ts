import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { authenticateUser, registerUser } from '../services/authService';

const registerSchema = z.object({
  username: z.string().min(3).max(64),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
});

export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, 'Invalid registration payload');
    }

    if (!req.file) {
      throw createHttpError(400, 'Profile photo is required');
    }

    const authResponse = await registerUser({
      username: parsed.data.username,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      password: parsed.data.password,
      photo: {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
      },
    });

    res.status(201).json(authResponse);
  } catch (error) {
    next(error);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createHttpError(400, 'Invalid credentials payload');
    }

    const authResponse = await authenticateUser(parsed.data);
    res.json(authResponse);
  } catch (error) {
    next(error);
  }
};
