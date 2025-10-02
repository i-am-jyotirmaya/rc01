import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { loginHandler, registerHandler } from '../controllers/authController';
import { upload } from '../middleware/upload';

export const authRouter: ExpressRouter = Router();

authRouter.post('/register', upload.single('photo'), registerHandler);
authRouter.post('/login', loginHandler);
