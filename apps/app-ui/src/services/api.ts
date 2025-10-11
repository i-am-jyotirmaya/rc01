import { createApiLayer } from "@rc01/api-client";

const baseUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();

export const apiLayer = createApiLayer({
  baseUrl: baseUrl ? baseUrl : undefined,
});

export const setApiAuthToken = (token: string | null | undefined) => {
  const normalized = typeof token === "string" ? token.trim() : "";
  if (normalized) {
    apiLayer.client.setDefaultHeader("Authorization", `Bearer ${normalized}`);
    return;
  }

  apiLayer.client.setDefaultHeader("Authorization", null);
};

export const authApi = apiLayer.auth;
export const battleApi = apiLayer.battles;
export const problemApi = apiLayer.problems;
