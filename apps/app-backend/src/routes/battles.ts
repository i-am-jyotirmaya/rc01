import { Router } from 'express';
import {
  createBattleHandler,
  listBattlesHandler,
  startBattleHandler,
  updateBattleHandler,
} from '../controllers/battleController';

export const battleRouter: Router = Router();

battleRouter.get('/', listBattlesHandler);
battleRouter.post('/', createBattleHandler);
battleRouter.patch('/:battleId', updateBattleHandler);
battleRouter.post('/:battleId/start', startBattleHandler);
