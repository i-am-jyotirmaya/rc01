export interface ApiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  defaultHeaders?: HeadersInit;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ApiClient {
  private baseUrl?: string;
  private readonly fetchFn?: typeof fetch;
  private readonly defaultHeaders: HeadersInit;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl
      ? options.baseUrl.replace(/\/$/, "")
      : undefined;
    this.fetchFn =
      options?.fetchFn ??
      (typeof fetch === "function" ? fetch.bind(globalThis) : undefined);
    this.defaultHeaders = options?.defaultHeaders ?? {
      "Content-Type": "application/json",
    };
  }

  setBaseUrl(baseUrl?: string): void {
    this.baseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : undefined;
  }

  getBaseUrl(): string | undefined {
    return this.baseUrl;
  }

  private isMockMode(): boolean {
    return !this.baseUrl || typeof this.fetchFn !== "function";
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    const base = this.baseUrl ?? "";
    return base + normalizedPath;
  }

  private mergeHeaders(override?: HeadersInit): Headers {
    const headers = new Headers();

    const apply = (input?: HeadersInit) => {
      if (!input) {
        return;
      }

      if (input instanceof Headers) {
        input.forEach((value, key) => {
          headers.set(key, value);
        });
        return;
      }

      if (Array.isArray(input)) {
        input.forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers.set(key, value);
          }
        });
        return;
      }

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, value as string);
        }
      });
    };

    apply(this.defaultHeaders);
    apply(override);

    return headers;
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    if (this.isMockMode()) {
      return Promise.resolve({} as T);
    }

    const headers = this.mergeHeaders(init?.headers);
    const response = await this.fetchFn!(this.buildUrl(path), {
      method: 'GET',
      headers,
      ...init,
    });

    if (!response.ok) {
      const message = await this.safeReadError(response);
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    if (this.isMockMode()) {
      // Backend wiring not ready; resolve immediately to keep the UI responsive during integration work.
      return Promise.resolve({} as T);
    }

    const headers = this.mergeHeaders(init?.headers);
    let requestBody: BodyInit | null = null;

    if (body instanceof FormData) {
      requestBody = body;
      headers.delete("Content-Type");
    } else if (
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      typeof body === "string"
    ) {
      requestBody = body as BodyInit;
    } else if (body !== undefined && body !== null) {
      requestBody = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    } else if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetchFn!(this.buildUrl(path), {
      method: "POST",
      body: requestBody ?? JSON.stringify({}),
      headers,
      ...init,
    });

    if (!response.ok) {
      const message = await this.safeReadError(response);
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    if (this.isMockMode()) {
      return Promise.resolve({} as T);
    }

    const headers = this.mergeHeaders(init?.headers);
    let requestBody: BodyInit | null = null;

    if (body instanceof FormData) {
      requestBody = body;
      headers.delete('Content-Type');
    } else if (
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      typeof body === 'string'
    ) {
      requestBody = body as BodyInit;
    } else if (body !== undefined && body !== null) {
      requestBody = JSON.stringify(body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    } else if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await this.fetchFn!(this.buildUrl(path), {
      method: 'PATCH',
      body: requestBody ?? JSON.stringify({}),
      headers,
      ...init,
    });

    if (!response.ok) {
      const message = await this.safeReadError(response);
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  private async safeReadError(response: Response): Promise<string> {
    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        return data.message;
      }
    } catch (error) {
      // ignore JSON parse issues and fall back to status text
    }
    return response.statusText || "Request failed";
  }
}

export interface LoginRequestPayload {
  username: string;
  password: string;
}

export type LoginResponsePayload = AuthResponsePayload;

export interface RegisterRequestPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  photo?: File | Blob;
}

export type RegisterResponsePayload = AuthResponsePayload;

export interface AuthUserPayload {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  photoPath: string | null;
  createdAt: string;
}

export interface AuthResponsePayload {
  token: string;
  user: AuthUserPayload;
}

interface AuthRoutesConfig {
  login: string;
  register: string;
}

const defaultAuthRoutes: AuthRoutesConfig = {
  login: "/api/auth/login",
  register: "/api/auth/register",
};

export class AuthApi {
  private readonly routes: AuthRoutesConfig;

  constructor(
    private readonly client: ApiClient,
    routes: Partial<AuthRoutesConfig> = {}
  ) {
    this.routes = { ...defaultAuthRoutes, ...routes };
  }

  login(payload: LoginRequestPayload) {
    return this.client.post<LoginResponsePayload>(this.routes.login, payload);
  }

  register(payload: RegisterRequestPayload) {
    const formData = new FormData();
    formData.append("username", payload.username);
    formData.append("email", payload.email);
    formData.append("firstName", payload.firstName);
    formData.append("lastName", payload.lastName);
    formData.append("password", payload.password);

    if (payload.photo) {
      formData.append("photo", payload.photo);
    }

    return this.client.post<RegisterResponsePayload>(
      this.routes.register,
      formData
    );
  }
}

export type BattleStatus =
  | 'draft'
  | 'configuring'
  | 'lobby'
  | 'ready'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled';

export type BattleStartMode = 'manual' | 'scheduled';

export interface BattleRecord {
  id: string;
  name: string;
  shortDescription: string | null;
  status: BattleStatus;
  configuration: Record<string, unknown>;
  autoStart: boolean;
  scheduledStartAt: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BattleParticipantRole = 'owner' | 'admin' | 'editor' | 'user';

export type BattleParticipantStatus = 'pending' | 'accepted' | 'left';

export type BattlePermission =
  | 'battle.view'
  | 'battle.configure'
  | 'battle.manageProblems'
  | 'battle.manageParticipants'
  | 'battle.manageInvitations'
  | 'battle.start'
  | 'battle.play'
  | 'battle.submitSolution'
  | 'battle.viewSubmissions';

export interface BattleParticipantRecord {
  id: string;
  battleId: string;
  userId: string;
  role: BattleParticipantRole;
  status: BattleParticipantStatus;
  permissions: BattlePermission[];
  invitedAt: string;
  joinedAt: string | null;
  leftAt: string | null;
  isContestant: boolean;
}

export interface BattleInviteRecord {
  id: string;
  battleId: string;
  token: string;
  createdByUserId: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateBattleRequestPayload {
  name: string;
  shortDescription?: string | null;
  configuration?: Record<string, unknown>;
  startMode: BattleStartMode;
  scheduledStartAt?: string | null;
}

export interface UpdateBattleRequestPayload {
  name?: string;
  shortDescription?: string | null;
  configuration?: Record<string, unknown>;
  startMode?: BattleStartMode;
  scheduledStartAt?: string | null;
  status?: BattleStatus;
}

export interface BattleResponsePayload {
  battle: BattleRecord;
}

export interface ListBattlesResponsePayload {
  battles: BattleRecord[];
}

export type ProblemDifficulty = 'easy' | 'medium' | 'hard' | 'insane';

export interface ProblemMetadata {
  slug: string;
  filename: string;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  estimatedDurationMinutes?: number;
  author?: string;
  source?: string;
  updatedAt: string;
  hash: string;
}

export interface ProblemRecord extends ProblemMetadata {
  content: string;
}

export interface ListProblemsResponsePayload {
  problems: ProblemMetadata[];
}

export interface ProblemResponsePayload {
  problem: ProblemRecord;
}

export interface JoinBattleRequestPayload {
  role?: BattleParticipantRole;
  password?: string;
  inviteToken?: string;
}

export interface JoinBattleResponsePayload {
  participant: BattleParticipantRecord;
  wasCreated: boolean;
}

export interface ListBattleParticipantsResponsePayload {
  participants: BattleParticipantRecord[];
}

export interface LeaveBattleResponsePayload {
  participant: BattleParticipantRecord;
}

export interface UpdateParticipantRoleRequestPayload {
  targetUserId: string;
  role: Exclude<BattleParticipantRole, 'owner'>;
}

export interface UpdateContestantsRequestPayload {
  contestantUserIds: string[];
}

export interface UpdateContestantsResponsePayload {
  contestants: BattleParticipantRecord[];
}

export interface CreateBattleInviteResponsePayload {
  invite: BattleInviteRecord;
}

export interface ListBattleInvitesResponsePayload {
  invites: BattleInviteRecord[];
}

export interface RevokeBattleInviteResponsePayload {
  invite: BattleInviteRecord;
}

interface BattleRoutesConfig {
  base: string;
}

const defaultBattleRoutes: BattleRoutesConfig = {
  base: '/api/battles',
};

export class BattleApi {
  private readonly routes: BattleRoutesConfig;

  constructor(private readonly client: ApiClient, routes: Partial<BattleRoutesConfig> = {}) {
    this.routes = { ...defaultBattleRoutes, ...routes };
  }

  listBattles() {
    return this.client.get<ListBattlesResponsePayload>(this.routes.base);
  }

  createBattle(payload: CreateBattleRequestPayload) {
    return this.client.post<BattleResponsePayload>(this.routes.base, payload);
  }

  updateBattle(battleId: string, payload: UpdateBattleRequestPayload) {
    return this.client.patch<BattleResponsePayload>(`${this.routes.base}/${battleId}`, payload);
  }

  startBattle(battleId: string) {
    return this.client.post<BattleResponsePayload>(`${this.routes.base}/${battleId}/start`);
  }

  joinBattle(battleId: string, payload: JoinBattleRequestPayload = {}) {
    return this.client.post<JoinBattleResponsePayload>(`${this.routes.base}/${battleId}/join`, payload);
  }

  public getBattle(battleId: string) {
    return this.client.get<BattleResponsePayload>(`${this.routes.base}/${battleId}`);
  }

  listParticipants(battleId: string) {
    return this.client.get<ListBattleParticipantsResponsePayload>(`${this.routes.base}/${battleId}/participants`);
  }

  leaveBattle(battleId: string) {
    return this.client.post<LeaveBattleResponsePayload>(`${this.routes.base}/${battleId}/leave`);
  }

  updateParticipantRole(battleId: string, payload: UpdateParticipantRoleRequestPayload) {
    return this.client.post<{ participant: BattleParticipantRecord }>(
      `${this.routes.base}/${battleId}/participants/role`,
      payload,
    );
  }

  updateContestants(battleId: string, payload: UpdateContestantsRequestPayload) {
    return this.client.put<UpdateContestantsResponsePayload>(
      `${this.routes.base}/${battleId}/contestants`,
      payload,
    );
  }

  createInvite(battleId: string) {
    return this.client.post<CreateBattleInviteResponsePayload>(`${this.routes.base}/${battleId}/invites`);
  }

  listInvites(battleId: string) {
    return this.client.get<ListBattleInvitesResponsePayload>(`${this.routes.base}/${battleId}/invites`);
  }

  revokeInvite(battleId: string, inviteId: string) {
    return this.client.post<RevokeBattleInviteResponsePayload>(
      `${this.routes.base}/${battleId}/invites/revoke`,
      { inviteId },
    );
  }
}

interface ProblemRoutesConfig {
  base: string;
}

const defaultProblemRoutes: ProblemRoutesConfig = {
  base: '/api/problems',
};

export class ProblemApi {
  private readonly routes: ProblemRoutesConfig;

  constructor(private readonly client: ApiClient, routes: Partial<ProblemRoutesConfig> = {}) {
    this.routes = { ...defaultProblemRoutes, ...routes };
  }

  listProblems() {
    return this.client.get<ListProblemsResponsePayload>(this.routes.base);
  }

  getProblem(slug: string) {
    return this.client.get<ProblemResponsePayload>(`${this.routes.base}/${encodeURIComponent(slug)}`);
  }

  createProblemFromContent(content: string) {
    return this.client.post<ProblemResponsePayload>(this.routes.base, { content });
  }

  uploadProblemFile(file: File | Blob) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post<ProblemResponsePayload>(this.routes.base, formData);
  }

  updateProblem(slug: string, content: string) {
    return this.client.patch<ProblemResponsePayload>(`${this.routes.base}/${encodeURIComponent(slug)}`, {
      content,
    });
  }
}

export interface ApiLayerConfig extends ApiClientOptions {
  authRoutes?: Partial<AuthRoutesConfig>;
  battleRoutes?: Partial<BattleRoutesConfig>;
  problemRoutes?: Partial<ProblemRoutesConfig>;
}

export const createApiLayer = (config?: ApiLayerConfig) => {
  const client = new ApiClient(config);
  const auth = new AuthApi(client, config?.authRoutes);
  const battles = new BattleApi(client, config?.battleRoutes);
  const problems = new ProblemApi(client, config?.problemRoutes);
  return { client, auth, battles, problems };
};
