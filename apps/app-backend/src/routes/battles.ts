import { Router } from 'express';
import {
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
battleRouter.post('/', createBattleHandler);
battleRouter.patch('/:battleId', updateBattleHandler);
battleRouter.post('/:battleId/start', startBattleHandler);
battleRouter.post('/:battleId/join', requireAuth, joinBattleHandler);
