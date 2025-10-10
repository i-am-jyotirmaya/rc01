export const buildBattleRoomName = (battleId: string): string => `battle:${battleId}`;

export const BattleSocketEvent = {
  LobbyOpened: 'battle:lobby-opened',
  StatusChanged: 'battle:status-changed',
  ParticipantJoined: 'battle:participant-joined',
  ParticipantLeft: 'battle:participant-left',
  ParticipantUpdated: 'battle:participant-updated',
  ContestantsUpdated: 'battle:contestants-updated',
  InviteCreated: 'battle:invite-created',
  InviteRevoked: 'battle:invite-revoked',
} as const;

export type BattleSocketEventName = (typeof BattleSocketEvent)[keyof typeof BattleSocketEvent];

export const BattleClientEvent = {
  Subscribe: 'battle:subscribe',
  Unsubscribe: 'battle:unsubscribe',
} as const;

export type BattleClientEventName = (typeof BattleClientEvent)[keyof typeof BattleClientEvent];

export interface BattleSubscriptionPayload {
  battleId: string;
}

export interface BattleParticipantEventPayload<T = unknown> {
  participant: T;
}

export interface BattleContestantsEventPayload<T = unknown> {
  contestants: T[];
}

export interface BattleStatusEventPayload {
  battleId: string;
  status: string;
}

export interface BattleInviteEventPayload<T = unknown> {
  invite: T;
}

export interface BattleInviteRevokedEventPayload {
  inviteId: string;
}
