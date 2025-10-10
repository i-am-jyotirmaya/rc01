import { randomUUID } from 'node:crypto';
import { insertUser } from '@rc01/db';
import {
  battleEvents,
  createBattle,
  inviteBattleParticipant,
  joinBattle,
  leaveBattle,
  startBattle,
  updateBattle,
  updateBattleContestants,
  updateBattleParticipantRole,
  createBattleInvite,
  listBattleInvites,
  revokeBattleInvite,
  type BattleRecord,
} from '../services/battleService.js';
import { setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const createUser = async (overrides: Partial<{ username: string }> = {}) => {
  const id = randomUUID();
  const baseUsername = overrides.username ?? `user-${id.slice(0, 8)}`;
  const username = overrides.username ? `${baseUsername}-${id.slice(0, 6)}` : baseUsername;

  await insertUser({
    id,
    username,
    email: `${username}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashed',
    photoPath: null,
  });

  return { id, username };
};

describe('battleService lobby state', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    battleEvents.removeAllListeners();
    await teardownTestDatabase();
  });

  it('locks configuration updates once the lobby opens and emits an event', async () => {
    const lobbyOpened: BattleRecord[] = [];
    battleEvents.once('battle.lobby-opened', (battle) => {
      lobbyOpened.push(battle);
    });

    const owner = await createUser({ username: 'lobby-owner' });

    const created = await createBattle({
      name: 'Lobby Battle',
      startMode: 'manual',
      configuration: { allowSpectators: true },
      createdByUserId: owner.id,
    });

    const ready = await updateBattle(created.id, { status: 'ready' });
    expect(ready.status).toBe('ready');

    const lobby = await updateBattle(created.id, { status: 'lobby' });
    expect(lobby.status).toBe('lobby');

    expect(lobbyOpened).toHaveLength(1);
    expect(lobbyOpened[0].id).toBe(created.id);

    await expect(updateBattle(created.id, { name: 'New Name' })).rejects.toMatchObject({ status: 409 });
  });

  it('enforces join guards for players while supporting administrative role invitations', async () => {
    const owner = await createUser({ username: 'battle-owner' });
    const admin = await createUser({ username: 'battle-admin' });
    const otherAdmin = await createUser({ username: 'other-admin' });
    const player = await createUser({ username: 'battle-player' });

    const joinEvents: { battleId: string }[] = [];
    battleEvents.on('battle.participant-joined', ({ battleId }) => {
      joinEvents.push({ battleId });
    });

    const created = await createBattle({
      name: 'Join Battle',
      startMode: 'manual',
      configuration: {},
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });

    const ownerPresence = await joinBattle({ battleId: created.id, userId: owner.id });
    expect(ownerPresence.wasCreated).toBe(false);
    expect(ownerPresence.participant.role).toBe('owner');
    expect(ownerPresence.participant.status).toBe('accepted');

    const pendingAdmin = await inviteBattleParticipant({
      battleId: created.id,
      inviterUserId: owner.id,
      inviteeUserId: admin.id,
      role: 'admin',
    });
    expect(pendingAdmin.status).toBe('pending');

    const acceptedAdmin = await joinBattle({ battleId: created.id, userId: admin.id });
    expect(acceptedAdmin.wasCreated).toBe(false);
    expect(acceptedAdmin.participant.role).toBe('admin');
    expect(acceptedAdmin.participant.status).toBe('accepted');

    await expect(joinBattle({ battleId: created.id, userId: otherAdmin.id, role: 'admin' })).rejects.toMatchObject({ status: 403 });

    await expect(joinBattle({ battleId: created.id, userId: player.id })).rejects.toMatchObject({ status: 409 });

    await updateBattle(created.id, { status: 'lobby' });

    const playerJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(playerJoin.wasCreated).toBe(true);
    expect(playerJoin.participant.role).toBe('user');
    expect(playerJoin.participant.status).toBe('accepted');

    const duplicateJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(duplicateJoin.wasCreated).toBe(false);

    expect(joinEvents.filter((event) => event.battleId === created.id)).toHaveLength(3);
  });

  it('allows starting battles from the lobby state', async () => {
    const owner = await createUser({ username: 'start-owner' });

    const created = await createBattle({
      name: 'Startable Battle',
      startMode: 'manual',
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });
    await updateBattle(created.id, { status: 'lobby' });

    const active = await startBattle(created.id);
    expect(active.status).toBe('active');
  });

  it('allows joining password-protected battles with valid credentials and invite tokens', async () => {
    const owner = await createUser({ username: 'protected-owner' });
    const spectator = await createUser({ username: 'protected-spectator' });
    const invited = await createUser({ username: 'protected-invited' });

    const created = await createBattle({
      name: 'Protected Battle',
      startMode: 'manual',
      configuration: { visibility: 'password', password: 'topsecret', maxContestants: 3 },
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });
    await updateBattle(created.id, { status: 'lobby' });

    await expect(joinBattle({ battleId: created.id, userId: spectator.id })).rejects.toMatchObject({ status: 403 });

    const joinedWithPassword = await joinBattle({
      battleId: created.id,
      userId: spectator.id,
      password: 'topsecret',
    });
    expect(joinedWithPassword.participant.status).toBe('accepted');

    const invite = await createBattleInvite({ battleId: created.id, userId: owner.id });
    const joinedWithInvite = await joinBattle({
      battleId: created.id,
      userId: invited.id,
      inviteToken: invite.token,
    });
    expect(joinedWithInvite.wasCreated).toBe(true);
    expect(joinedWithInvite.participant.role).toBe('user');
  });

  it('enforces contestant limits when selecting battle participants', async () => {
    const owner = await createUser({ username: 'contest-owner' });
    const admin = await createUser({ username: 'contest-admin' });
    const playerA = await createUser({ username: 'contest-a' });
    const playerB = await createUser({ username: 'contest-b' });
    const playerC = await createUser({ username: 'contest-c' });

    const created = await createBattle({
      name: 'Contest Battle',
      startMode: 'manual',
      configuration: { maxContestants: 2 },
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });
    await updateBattle(created.id, { status: 'lobby' });

    await inviteBattleParticipant({
      battleId: created.id,
      inviterUserId: owner.id,
      inviteeUserId: admin.id,
      role: 'admin',
    });

    await joinBattle({ battleId: created.id, userId: owner.id });
    await joinBattle({ battleId: created.id, userId: admin.id });
    await joinBattle({ battleId: created.id, userId: playerA.id });
    await joinBattle({ battleId: created.id, userId: playerB.id });
    await joinBattle({ battleId: created.id, userId: playerC.id });

    await expect(
      updateBattleContestants({
        battleId: created.id,
        actingUserId: admin.id,
        contestantUserIds: [playerA.id, playerB.id, playerC.id],
      }),
    ).rejects.toMatchObject({ status: 409 });

    const contestants = await updateBattleContestants({
      battleId: created.id,
      actingUserId: owner.id,
      contestantUserIds: [playerA.id, playerB.id],
    });

    expect(contestants).toHaveLength(2);
    expect(new Set(contestants.map((participant) => participant.userId))).toEqual(
      new Set([playerA.id, playerB.id]),
    );
  });

  it('supports role updates, participant exits, and invite revocation', async () => {
    const owner = await createUser({ username: 'lifecycle-owner' });
    const participant = await createUser({ username: 'lifecycle-user' });

    const created = await createBattle({
      name: 'Lifecycle Battle',
      startMode: 'manual',
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });
    await updateBattle(created.id, { status: 'lobby' });

    await joinBattle({ battleId: created.id, userId: owner.id });
    await joinBattle({ battleId: created.id, userId: participant.id });

    const promoted = await updateBattleParticipantRole({
      battleId: created.id,
      actingUserId: owner.id,
      targetUserId: participant.id,
      role: 'editor',
    });
    expect(promoted.role).toBe('editor');

    await expect(
      updateBattleParticipantRole({
        battleId: created.id,
        actingUserId: participant.id,
        targetUserId: owner.id,
        role: 'editor',
      }),
    ).rejects.toMatchObject({ status: 403 });

    const leftRecord = await leaveBattle(created.id, participant.id);
    expect(leftRecord.status).toBe('left');
    expect(leftRecord.leftAt).not.toBeNull();

    const invite = await createBattleInvite({ battleId: created.id, userId: owner.id });
    const invites = await listBattleInvites(created.id, owner.id);
    expect(invites.find((item) => item.id === invite.id)).toBeTruthy();

    const revoked = await revokeBattleInvite({ battleId: created.id, userId: owner.id, inviteId: invite.id });
    expect(revoked.revokedAt).not.toBeNull();
  });

  it('restricts invite creation to management roles', async () => {
    const owner = await createUser({ username: 'invite-owner' });
    const player = await createUser({ username: 'invite-player' });

    const created = await createBattle({
      name: 'Invite Restrictions',
      startMode: 'manual',
      configuration: {},
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });
    await joinBattle({ battleId: created.id, userId: owner.id });

    await updateBattle(created.id, { status: 'lobby' });
    await joinBattle({ battleId: created.id, userId: player.id });

    await expect(createBattleInvite({ battleId: created.id, userId: player.id })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('prevents re-inviting the owner with a different role', async () => {
    const owner = await createUser({ username: 'owner-guard' });
    const admin = await createUser({ username: 'owner-guard-admin' });

    const created = await createBattle({
      name: 'Owner Guard Battle',
      startMode: 'manual',
      configuration: {},
      createdByUserId: owner.id,
    });

    await updateBattle(created.id, { status: 'ready' });

    await joinBattle({ battleId: created.id, userId: owner.id });

    await inviteBattleParticipant({
      battleId: created.id,
      inviterUserId: owner.id,
      inviteeUserId: admin.id,
      role: 'admin',
    });

    await joinBattle({ battleId: created.id, userId: admin.id });

    await expect(
      inviteBattleParticipant({
        battleId: created.id,
        inviterUserId: admin.id,
        inviteeUserId: owner.id,
        role: 'admin',
      }),
    ).rejects.toMatchObject({ status: 403 });

    const ownerPresence = await joinBattle({ battleId: created.id, userId: owner.id });
    expect(ownerPresence.participant.role).toBe('owner');
    expect(ownerPresence.participant.status).toBe('accepted');
  });
});
