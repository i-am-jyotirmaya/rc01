import { PrismaClient } from "../generated/sqlite/index.js";
import type { DatabaseClient, DatabaseKind } from "../databaseClient.js";
import {
  mapBattle,
  mapBattleInvite,
  mapBattleParticipant,
  mapUser,
  toBattleInviteCreateData,
  toBattleInviteUpdateData,
  toBattleParticipantCreateData,
  toBattleParticipantUpdateData,
  toSqliteBattleCreateData,
  toSqliteBattleUpdateData,
  toUserCreateData,
} from "./mappers.js";
import type {
  BattleParticipantRole,
  CreateBattleInvitePayload,
  CreateBattleParticipantPayload,
  CreateBattlePayload,
  CreateUserPayload,
  DbBattleInviteRow,
  DbBattleParticipantRow,
  DbBattleRow,
  DbUserRow,
  UpdateBattleInvitePayload,
  UpdateBattleParticipantPayload,
  UpdateBattlePayload,
} from "../types.js";

export class PrismaSqliteDatabase implements DatabaseClient {
  public readonly kind: DatabaseKind = "sqlite";
  private readonly prisma: PrismaClient;

  constructor(databaseUrl?: string) {
    this.prisma = new PrismaClient(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : undefined,
    );
  }

  public readonly users = {
    insert: async (payload: CreateUserPayload): Promise<DbUserRow> => {
      const created = await this.prisma.user.create({
        data: toUserCreateData(payload),
      });
      return mapUser(created);
    },

    findByUsername: async (username: string): Promise<DbUserRow | null> => {
      const found = await this.prisma.user.findUnique({ where: { username } });
      return found ? mapUser(found) : null;
    },

    findByEmail: async (email: string): Promise<DbUserRow | null> => {
      const found = await this.prisma.user.findUnique({ where: { email } });
      return found ? mapUser(found) : null;
    },

    findById: async (id: string): Promise<DbUserRow | null> => {
      const found = await this.prisma.user.findUnique({ where: { id } });
      return found ? mapUser(found) : null;
    },
  };

  public readonly battles = {
    insert: async (payload: CreateBattlePayload): Promise<DbBattleRow> => {
      const created = await this.prisma.battle.create({
        data: toSqliteBattleCreateData(payload),
      });
      return mapBattle(created);
    },

    list: async (): Promise<DbBattleRow[]> => {
      const battles = await this.prisma.battle.findMany({
        orderBy: { createdAt: "desc" },
      });
      return battles.map(mapBattle);
    },

    listScheduled: async (): Promise<DbBattleRow[]> => {
      const battles = await this.prisma.battle.findMany({
        where: {
          autoStart: true,
          scheduledStartAt: { not: null },
          status: { in: ["scheduled", "lobby"] },
        },
        orderBy: { scheduledStartAt: "asc" },
      });
      return battles.map(mapBattle);
    },

    findById: async (id: string): Promise<DbBattleRow | null> => {
      const found = await this.prisma.battle.findUnique({ where: { id } });
      return found ? mapBattle(found) : null;
    },

    updateById: async (
      id: string,
      payload: UpdateBattlePayload,
    ): Promise<DbBattleRow | null> => {
      const data = toSqliteBattleUpdateData(payload);
      if (Object.keys(data).length === 0) {
        const existing = await this.prisma.battle.findUnique({ where: { id } });
        return existing ? mapBattle(existing) : null;
      }

      try {
        const updated = await this.prisma.battle.update({
          where: { id },
          data,
        });
        return mapBattle(updated);
      } catch (error) {
        if ((error as { code?: string }).code === "P2025") {
          return null;
        }
        throw error;
      }
    },
  };

  public readonly battleParticipants = {
    insert: async (
      payload: CreateBattleParticipantPayload,
    ): Promise<DbBattleParticipantRow> => {
      const created = await this.prisma.battleParticipant.create({
        data: toBattleParticipantCreateData(payload),
      });
      return mapBattleParticipant(created);
    },

    find: async (
      battleId: string,
      userId: string,
    ): Promise<DbBattleParticipantRow | null> => {
      const found = await this.prisma.battleParticipant.findUnique({
        where: {
          battleId_userId: {
            battleId,
            userId,
          },
        },
      });
      return found ? mapBattleParticipant(found) : null;
    },

    findByRole: async (
      battleId: string,
      role: BattleParticipantRole,
    ): Promise<DbBattleParticipantRow | null> => {
      const found = await this.prisma.battleParticipant.findFirst({
        where: {
          battleId,
          role,
        },
      });
      return found ? mapBattleParticipant(found) : null;
    },

    listByBattle: async (
      battleId: string,
    ): Promise<DbBattleParticipantRow[]> => {
      const participants = await this.prisma.battleParticipant.findMany({
        where: { battleId },
        orderBy: { createdAt: "asc" },
      });
      return participants.map(mapBattleParticipant);
    },

    updateById: async (
      id: string,
      payload: UpdateBattleParticipantPayload,
    ): Promise<DbBattleParticipantRow> => {
      const updated = await this.prisma.battleParticipant.update({
        where: { id },
        data: toBattleParticipantUpdateData(payload),
      });
      return mapBattleParticipant(updated);
    },
  };

  public readonly battleInvites = {
    insert: async (payload: CreateBattleInvitePayload): Promise<DbBattleInviteRow> => {
      const created = await this.prisma.battleInvite.create({
        data: toBattleInviteCreateData(payload),
      });
      return mapBattleInvite(created);
    },

    findByToken: async (token: string): Promise<DbBattleInviteRow | null> => {
      const found = await this.prisma.battleInvite.findUnique({ where: { token } });
      return found ? mapBattleInvite(found) : null;
    },

    listByBattle: async (battleId: string): Promise<DbBattleInviteRow[]> => {
      const invites = await this.prisma.battleInvite.findMany({
        where: { battleId },
        orderBy: { createdAt: "desc" },
      });
      return invites.map(mapBattleInvite);
    },

    updateById: async (id: string, payload: UpdateBattleInvitePayload): Promise<DbBattleInviteRow> => {
      const updated = await this.prisma.battleInvite.update({
        where: { id },
        data: toBattleInviteUpdateData(payload),
      });
      return mapBattleInvite(updated);
    },
  };

  public async runMigrations(): Promise<void> {
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          photo_path TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await tx.$executeRawUnsafe("ALTER TABLE users ADD COLUMN email TEXT");
      } catch (error) {
        if (!String(error).includes('duplicate column name')) {
          throw error;
        }
      }

      await tx.$executeRawUnsafe(
        "UPDATE users SET email = lower(username) || '@example.invalid' WHERE email IS NULL OR trim(email) = '';",
      );

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);",
      );

      await tx.$executeRawUnsafe(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);",
      );

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          short_description TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          configuration TEXT NOT NULL DEFAULT '{}',
          auto_start INTEGER NOT NULL DEFAULT 0,
          scheduled_start_at DATETIME,
          started_at DATETIME,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CHECK (status IN ('draft', 'configuring', 'scheduled', 'ready', 'lobby', 'active', 'completed', 'cancelled'))
        );
      `);

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status);",
      );
      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battles_scheduled_start ON battles (scheduled_start_at);",
      );

      const participantColumns = await tx.$queryRawUnsafe<Array<{ name: string }>>(
        "PRAGMA table_info('battle_participants');",
      );

      const hasContestantColumn = participantColumns.some((column) => column.name === 'is_contestant');

      if (!hasContestantColumn) {
        await tx.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS battle_participants_new (
            id TEXT PRIMARY KEY,
            battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user',
            status TEXT NOT NULL DEFAULT 'pending',
            is_contestant INTEGER NOT NULL DEFAULT 0,
            accepted_at DATETIME,
            left_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CHECK (role IN ('owner', 'admin', 'editor', 'user')),
            CHECK (status IN ('pending', 'accepted', 'left')),
            CHECK (is_contestant IN (0, 1)),
            UNIQUE (battle_id, user_id)
          );
        `);

        if (participantColumns.length > 0) {
          const existingParticipants = await tx.$queryRawUnsafe<
            Array<{
              id: string;
              battle_id: string;
              user_id: string;
              role: string;
              status: string;
              accepted_at: Date | null;
              created_at: Date;
            }>
          >(`
            SELECT id, battle_id, user_id, role, status, accepted_at, created_at
            FROM battle_participants;
          `);

          for (const participant of existingParticipants) {
            const normalizedRole = participant.role === 'player' ? 'user' : participant.role;
            const normalizedStatus = participant.status === 'left' ? 'left' : participant.status;

            await tx.$executeRawUnsafe(
              `INSERT OR IGNORE INTO battle_participants_new (
                id,
                battle_id,
                user_id,
                role,
                status,
                accepted_at,
                left_at,
                created_at,
                is_contestant
              ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0);`,
              participant.id,
              participant.battle_id,
              participant.user_id,
              normalizedRole,
              normalizedStatus,
              participant.accepted_at,
              participant.created_at,
            );
          }

          await tx.$executeRawUnsafe('DROP TABLE battle_participants;');
        }

        await tx.$executeRawUnsafe('ALTER TABLE battle_participants_new RENAME TO battle_participants;');
      }

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battle_participants (
          id TEXT PRIMARY KEY,
          battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'user',
          status TEXT NOT NULL DEFAULT 'pending',
          is_contestant INTEGER NOT NULL DEFAULT 0,
          accepted_at DATETIME,
          left_at DATETIME,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CHECK (role IN ('owner', 'admin', 'editor', 'user')),
          CHECK (status IN ('pending', 'accepted', 'left')),
          CHECK (is_contestant IN (0, 1)),
          UNIQUE (battle_id, user_id)
        );
      `);

      try {
        await tx.$executeRawUnsafe(
          "ALTER TABLE battle_participants ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';",
        );
      } catch (error) {
        if (!String(error).includes("duplicate column name")) {
          throw error;
        }
      }

      await tx.$executeRawUnsafe(
        "UPDATE battle_participants SET status = 'pending' WHERE status IS NULL;",
      );

      try {
        await tx.$executeRawUnsafe(
          "ALTER TABLE battle_participants ADD COLUMN accepted_at DATETIME;",
        );
      } catch (error) {
        if (!String(error).includes("duplicate column name")) {
          throw error;
        }
      }

      await tx.$executeRawUnsafe(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participants_owner ON battle_participants (battle_id) WHERE role = 'owner';",
      );

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battle_invites (
          id TEXT PRIMARY KEY,
          battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          revoked_at DATETIME
        );
      `);

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battle_invites_battle_id ON battle_invites (battle_id);",
      );
    });
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
