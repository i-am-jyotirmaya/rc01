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
  private readonly baseUrl?: string;
  private readonly fetchFn?: typeof fetch;
  private readonly defaultHeaders: HeadersInit;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl ? options.baseUrl.replace(/\/$/, "") : undefined;
    this.fetchFn = options?.fetchFn ?? (typeof fetch === "function" ? fetch.bind(globalThis) : undefined);
    this.defaultHeaders = options?.defaultHeaders ?? { "Content-Type": "application/json" };
  }

  private isMockMode(): boolean {
    return !this.baseUrl || typeof this.fetchFn !== "function";
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    const base = this.baseUrl ?? "";
    return base + normalizedPath;
  }

  async post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    if (this.isMockMode()) {
      // Backend wiring not ready; resolve immediately to keep the UI responsive during integration work.
      return Promise.resolve({} as T);
    }

    const response = await this.fetchFn!(this.buildUrl(path), {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      headers: {
        ...this.defaultHeaders,
        ...(init?.headers ?? {}),
      },
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
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  accessToken?: string;
  refreshToken?: string;
}

export interface RegisterRequestPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponsePayload {
  userId?: string;
}

interface AuthRoutesConfig {
  login: string;
  register: string;
}

const defaultAuthRoutes: AuthRoutesConfig = {
  login: "/auth/login",
  register: "/auth/register",
};

export class AuthApi {
  private readonly routes: AuthRoutesConfig;

  constructor(private readonly client: ApiClient, routes: Partial<AuthRoutesConfig> = {}) {
    this.routes = { ...defaultAuthRoutes, ...routes };
  }

  login(payload: LoginRequestPayload) {
    return this.client.post<LoginResponsePayload>(this.routes.login, payload);
  }

  register(payload: RegisterRequestPayload) {
    return this.client.post<RegisterResponsePayload>(this.routes.register, payload);
  }
}

export interface ApiLayerConfig extends ApiClientOptions {
  authRoutes?: Partial<AuthRoutesConfig>;
}

export const createApiLayer = (config?: ApiLayerConfig) => {
  const client = new ApiClient(config);
  const auth = new AuthApi(client, config?.authRoutes);
  return { client, auth };
};
