const rawBaseUrl = (import.meta.env?.VITE_FILE_MANAGER_BASE_URL as string | undefined)?.trim();
const rawAdminToken = (import.meta.env?.VITE_FILE_MANAGER_ADMIN_TOKEN as string | undefined)?.trim();

const normalizeBaseUrl = (baseUrl?: string): string => {
  if (!baseUrl) {
    throw new Error('File manager base URL is not configured.');
  }

  return baseUrl.replace(/\/$/, '');
};

const requireAdminToken = (token?: string): string => {
  if (!token) {
    throw new Error('File manager admin token is not configured.');
  }

  return token;
};

let cachedBaseUrl: string | null = null;
let cachedAdminToken: string | null = null;

export const getFileManagerBaseUrl = (): string => {
  if (!cachedBaseUrl) {
    cachedBaseUrl = normalizeBaseUrl(rawBaseUrl);
  }

  return cachedBaseUrl;
};

export const getFileManagerAdminToken = (): string => {
  if (!cachedAdminToken) {
    cachedAdminToken = requireAdminToken(rawAdminToken);
  }

  return cachedAdminToken;
};
