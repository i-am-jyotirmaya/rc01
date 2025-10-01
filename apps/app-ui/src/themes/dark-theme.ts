import type { ThemeConfig } from "antd";
import { theme } from "antd";

export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#fadb14",
    colorInfo: "#fadb14",
    colorSuccess: "#52c41a",
    colorLink: "#fadb14",
    borderRadius: 6,
    wireframe: false,
  },
  algorithm: theme.darkAlgorithm,
};
