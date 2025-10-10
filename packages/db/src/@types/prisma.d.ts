declare module '@prisma/client' {
  export type DatasourceConfig = {
    datasources?: {
      db?: {
        url?: string;
      };
    };
  };

  export class PrismaClient {
    constructor(config?: DatasourceConfig);
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T>;
    $executeRawUnsafe<T = unknown>(query: string, ...params: unknown[]): Promise<T>;
    user: {
      create(args: { data: any }): Promise<any>;
      findUnique(args: { where: any }): Promise<any | null>;
      findMany(args?: any): Promise<any[]>;
    };
    battle: {
      create(args: { data: any }): Promise<any>;
      findMany(args?: any): Promise<any[]>;
      findUnique(args: { where: any }): Promise<any | null>;
      update(args: { where: any; data: any }): Promise<any>;
    };
    battleParticipant: {
      create(args: { data: any }): Promise<any>;
      findUnique(args: { where: any }): Promise<any | null>;
      findFirst(args: { where: any }): Promise<any | null>;
      findMany(args?: any): Promise<any[]>;
    };
  }

  export namespace Prisma {
    type JsonValue = unknown;
  }
}
