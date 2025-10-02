import { createApiLayer } from "@rc/api-client";

const baseUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();

export const apiLayer = createApiLayer({
  baseUrl: baseUrl || undefined,
});

export const authApi = apiLayer.auth;
