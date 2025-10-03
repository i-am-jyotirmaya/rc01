export interface ApiEnvironmentOption {
  key: string;
  label: string;
  baseUrl?: string;
}

const sanitizeBaseUrl = (input?: string | null): string | undefined => {
  if (typeof input !== "string") {
    return undefined;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/$/, "");
};

const parseConfiguredEnvironments = (): ApiEnvironmentOption[] => {
  const raw = (import.meta.env?.VITE_API_ENVIRONMENTS as string | undefined)?.trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const key = typeof (entry as { key?: unknown }).key === "string" ? (entry as { key: string }).key.trim() : "";
        const label =
          typeof (entry as { label?: unknown }).label === "string" ? (entry as { label: string }).label.trim() : "";
        const baseUrl = sanitizeBaseUrl((entry as { baseUrl?: unknown }).baseUrl as string | undefined);

        if (!key || !label) {
          return null;
        }

        return { key, label, baseUrl } satisfies ApiEnvironmentOption;
      })
      .filter((option): option is ApiEnvironmentOption => Boolean(option));
  } catch (error) {
    console.warn("Failed to parse VITE_API_ENVIRONMENTS. Falling back to defaults.", error);
    return [];
  }
};

const configuredOptions = parseConfiguredEnvironments();
const configuredBaseUrl = sanitizeBaseUrl(import.meta.env?.VITE_API_BASE_URL as string | undefined);
const configuredKey = (import.meta.env?.VITE_API_ENVIRONMENT_KEY as string | undefined)?.trim();
const configuredLabel = (import.meta.env?.VITE_API_ENVIRONMENT_LABEL as string | undefined)?.trim();

const optionsMap = new Map<string, ApiEnvironmentOption>();

const addOption = (option: ApiEnvironmentOption) => {
  if (!option.key) {
    return;
  }

  optionsMap.set(option.key, option);
};

configuredOptions.forEach(addOption);

if (configuredBaseUrl) {
  addOption({
    key: configuredKey || "configured",
    label: configuredLabel || "Configured backend",
    baseUrl: configuredBaseUrl,
  });
}

addOption({
  key: "mock",
  label: "Mock API (offline)",
});

export const apiEnvironmentOptions = Array.from(optionsMap.values());

const defaultEnvironmentKey = (import.meta.env?.VITE_API_DEFAULT_ENVIRONMENT as string | undefined)?.trim();

export const API_ENV_STORAGE_KEY = "app-ui-selected-api-environment";

export const findApiEnvironmentOption = (key: string | null | undefined): ApiEnvironmentOption | undefined => {
  if (!key) {
    return undefined;
  }

  return apiEnvironmentOptions.find((option) => option.key === key);
};

export const getDefaultApiEnvironmentKey = (): string => {
  if (defaultEnvironmentKey && findApiEnvironmentOption(defaultEnvironmentKey)) {
    return defaultEnvironmentKey;
  }

  const firstWithBackend = apiEnvironmentOptions.find((option) => Boolean(option.baseUrl));
  return firstWithBackend?.key ?? apiEnvironmentOptions[0]?.key ?? "mock";
};

export const getInitialApiEnvironmentKey = (): string => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(API_ENV_STORAGE_KEY);
    if (stored && findApiEnvironmentOption(stored)) {
      return stored;
    }
  }

  return getDefaultApiEnvironmentKey();
};
