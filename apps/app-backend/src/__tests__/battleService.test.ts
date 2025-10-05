import { randomUUID } from 'node:crypto';
import { insertUser } from '@rc01/db';
import {
  battleEvents,
  assignBattleRole,
  createBattle,
  joinBattle,
  startBattle,
  updateBattle,
  type BattleRecord,
} from '../services/battleService.js';
import { setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const createUser = async (overrides: Partial<{ username: string }> = {}) => {
  const id = randomUUID();
  const username = overrides.username ?? `user-${id.slice(0, 8)}`;

  await insertUser({
    id,
    username,
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

    const owner = await createUser({ username: 'battle-owner' });
    const created = await createBattle({
      name: 'Lobby Battle',
      startMode: 'manual',
      configuration: { allowSpectators: true },
      ownerId: owner.id,
    });

    const published = await updateBattle(created.id, owner.id, { status: 'published' });
    expect(published.status).toBe('published');

    const lobby = await updateBattle(created.id, owner.id, { status: 'lobby' });
    expect(lobby.status).toBe('lobby');

    expect(lobbyOpened).toHaveLength(1);
    expect(lobbyOpened[0].id).toBe(created.id);

    await expect(updateBattle(created.id, owner.id, { name: 'New Name' })).rejects.toMatchObject({ status: 409 });
  });

  it('enforces join guards for players while allowing owners to control access and emits join events', async () => {
    const owner = await createUser({ username: 'battle-owner' });
    const player = await createUser({ username: 'battle-player' });
    const challenger = await createUser({ username: 'battle-challenger' });

    const created = await createBattle({
      name: 'Join Battle',
      startMode: 'manual',
      configuration: {},
      ownerId: owner.id,
    });

    const joinEvents: { battleId: string }[] = [];
    battleEvents.on('battle.participant-joined', ({ battleId }) => {
      joinEvents.push({ battleId });
    });

    const ownerJoin = await joinBattle({ battleId: created.id, userId: owner.id });
    expect(ownerJoin.wasCreated).toBe(false);
    expect(ownerJoin.participant.role).toBe('owner');

    await expect(joinBattle({ battleId: created.id, userId: player.id })).rejects.toMatchObject({ status: 409 });

    await updateBattle(created.id, owner.id, { status: 'published' });
    await expect(joinBattle({ battleId: created.id, userId: player.id })).rejects.toMatchObject({ status: 409 });

    await updateBattle(created.id, owner.id, { status: 'lobby' });

    const playerJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(playerJoin.wasCreated).toBe(true);
    expect(playerJoin.participant.role).toBe('player');

    const duplicateJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(duplicateJoin.wasCreated).toBe(false);

    await expect(joinBattle({ battleId: created.id, userId: challenger.id, role: 'owner' })).rejects.toMatchObject({ status: 403 });

    expect(joinEvents.filter((event) => event.battleId === created.id)).toHaveLength(1);
  });

  it('allows starting battles from the lobby state', async () => {
    const owner = await createUser({ username: 'battle-owner' });
    const created = await createBattle({
      name: 'Startable Battle',
      startMode: 'manual',
      ownerId: owner.id,
    });

    await updateBattle(created.id, owner.id, { status: 'published' });
    await updateBattle(created.id, owner.id, { status: 'lobby' });

    const live = await startBattle(created.id, owner.id);
    expect(live.status).toBe('live');
  });

  it('allows owners to assign elevated roles while restricting non-admins', async () => {
    const owner = await createUser({ username: 'role-owner' });
    const editorUser = await createUser({ username: 'role-editor' });
    const outsider = await createUser({ username: 'role-outsider' });

    const created = await createBattle({
      name: 'Role Battle',
      startMode: 'manual',
      ownerId: owner.id,
    });

    const editorParticipant = await assignBattleRole({
      battleId: created.id,
      actorUserId: owner.id,
      targetUserId: editorUser.id,
      role: 'editor',
    });

    expect(editorParticipant.role).toBe('editor');

    await expect(
      assignBattleRole({
        battleId: created.id,
        actorUserId: editorUser.id,
        targetUserId: outsider.id,
        role: 'player',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
