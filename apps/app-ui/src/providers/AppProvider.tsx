import { ConfigProvider } from "antd";
import type { FC, PropsWithChildren } from "react";
import { useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { lightThemeConfig } from "../themes/light-theme";
import { store } from "../store/store";

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const previous = {
      margin: document.body.style.margin,
      background: document.body.style.background,
      color: document.body.style.color,
      fontFamily: document.body.style.fontFamily,
    };

    document.body.style.margin = "0";
    document.body.style.background = "#050814";
    document.body.style.color = "#f0f5ff";
    document.body.style.fontFamily =
      '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

    return () => {
      document.body.style.margin = previous.margin;
      document.body.style.background = previous.background;
      document.body.style.color = previous.color;
      document.body.style.fontFamily = previous.fontFamily;
    };
  }, []);

  const themeConfig = useMemo(
    () => ({
      ...lightThemeConfig,
      token: {
        ...(lightThemeConfig.token ?? {}),
        colorBgLayout: "#050814",
        fontFamily:
          '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      },
    }),
    [],
  );

  return (
    <Provider store={store}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </Provider>
  );
};
