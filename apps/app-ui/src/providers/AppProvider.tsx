import { ConfigProvider } from "antd";
import type { FC, PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { darkThemeConfig } from "../themes/dark-theme";
import { lightThemeConfig } from "../themes/light-theme";
import { store } from "../store/store";
import type { ThemeMode } from "./theme-mode-context";
import { ThemeModeContext } from "./theme-mode-context";

const FONT_STACK =
  '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const THEME_STORAGE_KEY = "app-ui-theme-mode";

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedValue === "light" || storedValue === "dark") {
    return storedValue;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "dark";
};

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    const previous = {
      margin: document.body.style.margin,
      background: document.body.style.background,
      color: document.body.style.color,
      fontFamily: document.body.style.fontFamily,
    };

    document.body.style.margin = "0";
    document.body.style.fontFamily = FONT_STACK;

    return () => {
      document.body.style.margin = previous.margin;
      document.body.style.background = previous.background;
      document.body.style.color = previous.color;
      document.body.style.fontFamily = previous.fontFamily;
    };
  }, []);

  useEffect(() => {
    const isDark = mode === "dark";
    document.body.style.background = isDark ? "#050814" : "#f7f8ff";
    document.body.style.color = isDark ? "#f0f5ff" : "#050814";
  }, [mode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const themeConfig = useMemo(() => {
    const baseConfig = mode === "dark" ? darkThemeConfig : lightThemeConfig;

    return {
      ...baseConfig,
      token: {
        ...(baseConfig.token ?? {}),
        colorBgLayout: mode === "dark" ? "#050814" : "#f7f8ff",
        fontFamily: FONT_STACK,
      },
    };
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode,
      setMode,
    }),
    [mode, toggleMode],
  );

  return (
    <Provider store={store}>
      <ThemeModeContext.Provider value={contextValue}>
        <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
      </ThemeModeContext.Provider>
    </Provider>
  );
};
