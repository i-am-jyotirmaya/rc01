import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { battleRouter } from './routes/battles.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(env.uploadsDir, { extensions: ['jpg', 'jpeg', 'png'] }));
app.use('/api/auth', authRouter);
app.use('/api/battles', battleRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
