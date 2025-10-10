import { PrismaClient } from "@prisma/client";
import type { DatabaseClient, DatabaseKind } from "../databaseClient.js";
import {
  mapBattle,
  mapBattleParticipant,
  mapUser,
  toBattleCreateData,
  toBattleParticipantCreateData,
  toBattleUpdateData,
  toUserCreateData,
} from "./mappers.js";
import type {
  BattleParticipantRole,
  CreateBattleParticipantPayload,
  CreateBattlePayload,
  CreateUserPayload,
  DbBattleParticipantRow,
  DbBattleRow,
  DbUserRow,
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
  };

  public async runMigrations(): Promise<void> {
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          first_name VARCHAR(120) NOT NULL,
          last_name VARCHAR(120) NOT NULL,
          password_hash TEXT NOT NULL,
          photo_path TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await tx.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);",
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
          role VARCHAR(16) NOT NULL DEFAULT 'player',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (role IN ('host', 'player', 'spectator')),
          UNIQUE (battle_id, user_id)
        );
      `);

      await tx.$executeRawUnsafe(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_participants_host ON battle_participants (battle_id) WHERE role = 'host';",
      );
    });
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
