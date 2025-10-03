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
    this.baseUrl = options?.baseUrl ? options.baseUrl.replace(/\/$/, "") : undefined;
    this.fetchFn = options?.fetchFn ?? (typeof fetch === "function" ? fetch.bind(globalThis) : undefined);
    this.defaultHeaders = options?.defaultHeaders ?? { "Content-Type": "application/json" };
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
  firstName: string;
  lastName: string;
  password: string;
  photo?: File | Blob;
}

export type RegisterResponsePayload = AuthResponsePayload;

export interface AuthUserPayload {
  id: string;
  username: string;
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
    const formData = new FormData();
    formData.append("username", payload.username);
    formData.append("firstName", payload.firstName);
    formData.append("lastName", payload.lastName);
    formData.append("password", payload.password);

    if (payload.photo) {
      formData.append("photo", payload.photo);
    }

    return this.client.post<RegisterResponsePayload>(this.routes.register, formData);
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
