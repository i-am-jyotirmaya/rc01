import { PrismaClient } from "../generated/postgres/index.js";
import type { DatabaseClient, DatabaseKind } from "../databaseClient.js";
import {
  mapBattle,
  mapBattleInvite,
  mapBattleParticipant,
  mapUser,
  toBattleCreateData,
  toBattleInviteCreateData,
  toBattleInviteUpdateData,
  toBattleParticipantCreateData,
  toBattleParticipantUpdateData,
  toBattleUpdateData,
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

export class PrismaPostgresDatabase implements DatabaseClient {
  public readonly kind: DatabaseKind = "postgres";
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
        data: toBattleCreateData(payload),
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
      const data = toBattleUpdateData(payload);
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
          id UUID PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          email VARCHAR(320) UNIQUE NOT NULL,
          first_name VARCHAR(120) NOT NULL,
          last_name VARCHAR(120) NOT NULL,
          password_hash TEXT NOT NULL,
          photo_path TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await tx.$executeRawUnsafe(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(320)`,
      );

      await tx.$executeRawUnsafe(
        `UPDATE users SET email = lower(username) || '@example.invalid' WHERE email IS NULL OR trim(email) = ''`,
      );

      await tx.$executeRawUnsafe(
        `ALTER TABLE users ALTER COLUMN email SET NOT NULL`,
      );

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);",
      );

      await tx.$executeRawUnsafe(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);",
      );

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battles (
          id UUID PRIMARY KEY,
          name VARCHAR(160) NOT NULL,
          short_description TEXT,
          status VARCHAR(32) NOT NULL DEFAULT 'draft',
          configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
          auto_start BOOLEAN NOT NULL DEFAULT FALSE,
          scheduled_start_at TIMESTAMPTZ,
          started_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (status IN ('draft', 'configuring', 'scheduled', 'ready', 'lobby', 'active', 'completed', 'cancelled'))
        );
      `);

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status);",
      );
      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battles_scheduled_start ON battles (scheduled_start_at);",
      );

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battle_participants (
          id UUID PRIMARY KEY,
          battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(16) NOT NULL DEFAULT 'user',
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          is_contestant BOOLEAN NOT NULL DEFAULT FALSE,
          accepted_at TIMESTAMPTZ,
          left_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (role IN ('owner', 'admin', 'editor', 'user')),
          CHECK (status IN ('pending', 'accepted', 'left')),
          UNIQUE (battle_id, user_id)
        );
      `);

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS status VARCHAR(16);",
      );
      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;",
      );
      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ALTER COLUMN status SET DEFAULT 'pending';",
      );
      await tx.$executeRawUnsafe(
        "UPDATE battle_participants SET status = 'pending' WHERE status IS NULL;",
      );
      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ALTER COLUMN status SET NOT NULL;",
      );
      await tx.$executeRawUnsafe(`
        DO $$
        BEGIN
          ALTER TABLE battle_participants
            ADD CONSTRAINT battle_participants_status_check
            CHECK (status IN ('pending', 'accepted'));
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
        $$;
      `);

      await tx.$executeRawUnsafe(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participants_owner ON battle_participants (battle_id) WHERE role = 'owner';",
      );

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_battle_participants_battle_id ON battle_participants (battle_id);",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS is_contestant BOOLEAN NOT NULL DEFAULT FALSE;",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ALTER COLUMN role SET DEFAULT 'user';",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants DROP CONSTRAINT IF EXISTS battle_participants_role_check;",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD CONSTRAINT battle_participants_role_check CHECK (role IN ('owner', 'admin', 'editor', 'user'));",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants DROP CONSTRAINT IF EXISTS battle_participants_status_check;",
      );

      await tx.$executeRawUnsafe(
        "ALTER TABLE battle_participants ADD CONSTRAINT battle_participants_status_check CHECK (status IN ('pending', 'accepted', 'left'));",
      );

      await tx.$executeRawUnsafe(
        "UPDATE battle_participants SET role = 'user' WHERE role = 'player';",
      );

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS battle_invites (
          id UUID PRIMARY KEY,
          battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMPTZ
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
