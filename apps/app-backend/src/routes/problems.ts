import { Router } from 'express';

import {
  createProblemHandler,
  getProblemHandler,
  listProblemsHandler,
  problemUpload,
  updateProblemHandler,
} from '../controllers/problemController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const problemRouter: Router = Router();

problemRouter.get('/', listProblemsHandler);
problemRouter.get('/:slug', getProblemHandler);
problemRouter.post('/', requireAuth, problemUpload.single('file'), createProblemHandler);
problemRouter.patch('/:slug', requireAuth, updateProblemHandler);
