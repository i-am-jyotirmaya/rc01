import { Router } from 'express';
import {
  assignBattleRoleHandler,
  createBattleHandler,
  getBattleHandler,
  listBattlesHandler,
  joinBattleHandler,
  startBattleHandler,
  updateBattleHandler,
} from '../controllers/battleController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const battleRouter: Router = Router();

battleRouter.get('/', listBattlesHandler);
battleRouter.get('/:battleId', getBattleHandler);
battleRouter.post('/', requireAuth, createBattleHandler);
battleRouter.patch('/:battleId', requireAuth, updateBattleHandler);
battleRouter.post('/:battleId/start', requireAuth, startBattleHandler);
battleRouter.post('/:battleId/join', requireAuth, joinBattleHandler);
battleRouter.post('/:battleId/participants', requireAuth, assignBattleRoleHandler);
