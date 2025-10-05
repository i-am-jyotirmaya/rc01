import { Router } from 'express';

import {
  createProblemHandler,
  getProblemHandler,
  listProblemsHandler,
  problemUpload,
  updateProblemHandler,
} from '../controllers/problemController.js';

export const problemRouter: Router = Router();

problemRouter.get('/', listProblemsHandler);
problemRouter.get('/:slug', getProblemHandler);
problemRouter.post('/', problemUpload.single('file'), createProblemHandler);
problemRouter.patch('/:slug', updateProblemHandler);
