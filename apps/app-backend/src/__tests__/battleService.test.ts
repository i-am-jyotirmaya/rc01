import { randomUUID } from 'node:crypto';
import { insertUser } from '@codebattle/db';
import {
  battleEvents,
  createBattle,
  joinBattle,
  startBattle,
  updateBattle,
  type BattleRecord,
} from '../services/battleService';
import { setupTestDatabase, teardownTestDatabase } from './helpers/db';

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

    const created = await createBattle({
      name: 'Lobby Battle',
      startMode: 'manual',
      configuration: { allowSpectators: true },
    });

    const ready = await updateBattle(created.id, { status: 'ready' });
    expect(ready.status).toBe('ready');

    const lobby = await updateBattle(created.id, { status: 'lobby' });
    expect(lobby.status).toBe('lobby');

    expect(lobbyOpened).toHaveLength(1);
    expect(lobbyOpened[0].id).toBe(created.id);

    await expect(updateBattle(created.id, { name: 'New Name' })).rejects.toMatchObject({ status: 409 });
  });

  it('enforces join guards for players while allowing host enrollment and emits join events', async () => {
    const host = await createUser({ username: 'battle-host' });
    const player = await createUser({ username: 'battle-player' });
    const otherHost = await createUser({ username: 'other-host' });

    const created = await createBattle({
      name: 'Join Battle',
      startMode: 'manual',
      configuration: {},
    });

    await updateBattle(created.id, { status: 'ready' });

    const joinEvents: { battleId: string }[] = [];
    battleEvents.on('battle.participant-joined', ({ battleId }) => {
      joinEvents.push({ battleId });
    });

    const hostJoin = await joinBattle({ battleId: created.id, userId: host.id, role: 'host' });
    expect(hostJoin.wasCreated).toBe(true);
    expect(hostJoin.participant.role).toBe('host');

    await expect(joinBattle({ battleId: created.id, userId: player.id })).rejects.toMatchObject({ status: 409 });

    await updateBattle(created.id, { status: 'lobby' });

    const playerJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(playerJoin.wasCreated).toBe(true);
    expect(playerJoin.participant.role).toBe('player');

    const duplicateJoin = await joinBattle({ battleId: created.id, userId: player.id });
    expect(duplicateJoin.wasCreated).toBe(false);

    await expect(joinBattle({ battleId: created.id, userId: otherHost.id, role: 'host' })).rejects.toMatchObject({ status: 409 });

    expect(joinEvents.filter((event) => event.battleId === created.id)).toHaveLength(2);
  });

  it('allows starting battles from the lobby state', async () => {
    const created = await createBattle({
      name: 'Startable Battle',
      startMode: 'manual',
    });

    await updateBattle(created.id, { status: 'ready' });
    await updateBattle(created.id, { status: 'lobby' });

    const active = await startBattle(created.id);
    expect(active.status).toBe('active');
  });
});
