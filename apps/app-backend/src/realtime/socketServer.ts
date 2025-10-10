import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import createHttpError from 'http-errors';
import {
  battleEvents,
  type BattleInviteRecord,
  type BattleParticipantRecord,
  type BattleRecord,
} from '../services/battleService.js';
import { verifyAuthToken } from '../utils/tokens.js';
import { logger } from '../utils/logger.js';
import {
  BattleClientEvent,
  BattleSocketEvent,
  buildBattleRoomName,
  type BattleContestantsEventPayload,
  type BattleInviteEventPayload,
  type BattleInviteRevokedEventPayload,
  type BattleParticipantEventPayload,
  type BattleStatusEventPayload,
  type BattleSubscriptionPayload,
} from '@rc01/realtime-utils';
import { findBattleParticipant } from '@rc01/db';

interface AuthedSocket extends Socket {
  data: {
    user?: {
      id: string;
      username: string;
    };
  };
}

const isSubscriptionPayload = (payload: unknown): payload is BattleSubscriptionPayload => {
  return Boolean(payload && typeof (payload as BattleSubscriptionPayload).battleId === 'string');
};

const broadcast = <T>(io: Server, battleId: string, event: string, payload: T): void => {
  io.to(buildBattleRoomName(battleId)).emit(event, payload);
};

const handleSubscription = async (
  io: Server,
  socket: AuthedSocket,
  rawPayload: unknown,
  ack?: (error?: { message: string }) => void,
): Promise<void> => {
  if (!isSubscriptionPayload(rawPayload)) {
    if (ack) {
      ack({ message: 'Invalid subscription payload' });
    }
    return;
  }

  const { user } = socket.data;
  if (!user) {
    if (ack) {
      ack({ message: 'Authentication required' });
    }
    return;
  }

  try {
    const participant = await findBattleParticipant(rawPayload.battleId, user.id);
    if (!participant || participant.status !== 'accepted') {
      throw createHttpError(403, 'You are not allowed to subscribe to this battle');
    }

    const room = buildBattleRoomName(rawPayload.battleId);
    await socket.join(room);
    if (ack) {
      ack();
    }
  } catch (error) {
    if (ack) {
      ack({ message: (error as Error).message });
    }
  }
};

const handleUnsubscribe = async (
  socket: AuthedSocket,
  rawPayload: unknown,
  ack?: (error?: { message: string }) => void,
): Promise<void> => {
  if (!isSubscriptionPayload(rawPayload)) {
    if (ack) {
      ack({ message: 'Invalid subscription payload' });
    }
    return;
  }

  const room = buildBattleRoomName(rawPayload.battleId);
  await socket.leave(room);
  if (ack) {
    ack();
  }
};

const registerEventBridges = (io: Server): void => {
  battleEvents.on('battle.participant-joined', ({ battleId, participant }) => {
    broadcast<BattleParticipantEventPayload<BattleParticipantRecord>>(
      io,
      battleId,
      BattleSocketEvent.ParticipantJoined,
      { participant },
    );
  });

  battleEvents.on('battle.participant-left', ({ battleId, participant }) => {
    broadcast<BattleParticipantEventPayload<BattleParticipantRecord>>(
      io,
      battleId,
      BattleSocketEvent.ParticipantLeft,
      { participant },
    );
  });

  battleEvents.on('battle.participant-updated', ({ battleId, participant }) => {
    broadcast<BattleParticipantEventPayload<BattleParticipantRecord>>(
      io,
      battleId,
      BattleSocketEvent.ParticipantUpdated,
      { participant },
    );
  });

  battleEvents.on('battle.contestants-updated', ({ battleId, contestants }) => {
    broadcast<BattleContestantsEventPayload<BattleParticipantRecord>>(
      io,
      battleId,
      BattleSocketEvent.ContestantsUpdated,
      { contestants },
    );
  });

  battleEvents.on('battle.lobby-opened', (battle: BattleRecord) => {
    broadcast<{ battle: BattleRecord }>(io, battle.id, BattleSocketEvent.LobbyOpened, { battle });
  });

  battleEvents.on('battle.status-changed', ({ battleId, status }) => {
    broadcast<BattleStatusEventPayload>(io, battleId, BattleSocketEvent.StatusChanged, { battleId, status });
  });

  battleEvents.on('battle.invite-created', ({ battleId, invite }) => {
    broadcast<BattleInviteEventPayload<BattleInviteRecord>>(
      io,
      battleId,
      BattleSocketEvent.InviteCreated,
      { invite },
    );
  });

  battleEvents.on('battle.invite-revoked', ({ battleId, inviteId }) => {
    broadcast<BattleInviteRevokedEventPayload>(io, battleId, BattleSocketEvent.InviteRevoked, { inviteId });
  });
};

export const initializeBattleRealtime = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.use((socket, next) => {
    const token = (socket.handshake.auth?.token ?? socket.handshake.headers.authorization ?? '').toString();
    const normalizedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    if (!normalizedToken) {
      next(new Error('Authentication token is required'));
      return;
    }

    try {
      const payload = verifyAuthToken(normalizedToken);
      socket.data.user = { id: payload.sub, username: payload.username };
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on(BattleClientEvent.Subscribe, (payload, ack) => {
      void handleSubscription(io, socket, payload, ack);
    });

    socket.on(BattleClientEvent.Unsubscribe, (payload, ack) => {
      void handleUnsubscribe(socket, payload, ack);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  registerEventBridges(io);

  return io;
};
