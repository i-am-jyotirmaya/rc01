import { Router } from 'express';
import {
  createBattleHandler,
  getBattleHandler,
  listBattlesHandler,
  joinBattleHandler,
  leaveBattleHandler,
  listBattleInvitesHandler,
  listBattleParticipantsHandler,
  updateParticipantRoleHandler,
  updateContestantsHandler,
  createBattleInviteHandler,
  revokeBattleInviteHandler,
  startBattleHandler,
  updateBattleHandler,
} from '../controllers/battleController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const battleRouter: Router = Router();

battleRouter.get('/', listBattlesHandler);
battleRouter.get('/:battleId', getBattleHandler);
battleRouter.post('/', requireAuth, createBattleHandler);
battleRouter.patch('/:battleId', updateBattleHandler);
battleRouter.post('/:battleId/start', startBattleHandler);
battleRouter.post('/:battleId/join', requireAuth, joinBattleHandler);
battleRouter.get('/:battleId/participants', requireAuth, listBattleParticipantsHandler);
battleRouter.post('/:battleId/leave', requireAuth, leaveBattleHandler);
battleRouter.post('/:battleId/participants/role', requireAuth, updateParticipantRoleHandler);
battleRouter.put('/:battleId/contestants', requireAuth, updateContestantsHandler);
battleRouter.post('/:battleId/invites', requireAuth, createBattleInviteHandler);
battleRouter.get('/:battleId/invites', requireAuth, listBattleInvitesHandler);
battleRouter.post('/:battleId/invites/revoke', requireAuth, revokeBattleInviteHandler);
