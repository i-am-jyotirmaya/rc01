import { createApiLayer } from "@rc/api-client";

const baseUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();

export const apiLayer = createApiLayer({
  baseUrl: baseUrl ? baseUrl : undefined,
});

export const setApiBaseUrl = (nextBaseUrl?: string) => {
  apiLayer.client.setBaseUrl(nextBaseUrl && nextBaseUrl.trim() ? nextBaseUrl : undefined);
};

export const getApiBaseUrl = () => apiLayer.client.getBaseUrl();

export const authApi = apiLayer.auth;
