import { randomUUID } from 'node:crypto';
import { insertUser } from '@rc01/db';
import {
  battleEvents,
  createBattle,
  inviteBattleParticipant,
  joinBattle,
  startBattle,
  updateBattle,
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
    expect(playerJoin.participant.role).toBe('player');
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
});
