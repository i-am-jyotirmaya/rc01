export type BattleStatus =
  | 'draft'
  | 'configuring'
  | 'lobby'
  | 'scheduled'
  | 'ready'
  | 'active'
  | 'completed'
  | 'cancelled';

export type DbUserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  photo_path: string | null;
  created_at: Date;
};

export type CreateUserPayload = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  photoPath: string | null;
};

export type DbBattleRow = {
  id: string;
  name: string;
  short_description: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  auto_start: boolean;
  scheduled_start_at: Date | null;
  started_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CreateBattlePayload = {
  id: string;
  name: string;
  shortDescription?: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt?: Date | null;
  startedAt?: Date | null;
};

export type UpdateBattlePayload = Partial<{
  name: string;
  shortDescription: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
}>;

export type BattleParticipantRole = 'host' | 'player' | 'spectator';

export type DbBattleParticipantRow = {
  id: string;
  battle_id: string;
  user_id: string;
  role: BattleParticipantRole;
  created_at: Date;
};

export type CreateBattleParticipantPayload = {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
};

export type DatabaseInitOptions = {
  usePostgres?: boolean;
  databaseUrl?: string;
};
