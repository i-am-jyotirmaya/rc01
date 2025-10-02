import { MoonFilled, SunFilled } from "@ant-design/icons";
import { Switch, theme } from "antd";
import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { useThemeMode } from "../../providers/theme-mode-context";

export const ThemeToggle: FC = () => {
  const { mode, setMode } = useThemeMode();
  const { token } = theme.useToken();

  const handleChange = useCallback(
    (checked: boolean) => {
      setMode(checked ? "dark" : "light");
    },
    [setMode],
  );

  const switchStyle = useMemo(
    () => ({
      backgroundColor: mode === "dark" ? token.colorPrimary : "rgba(5, 8, 20, 0.35)",
      boxShadow:
        mode === "dark"
          ? "0 8px 18px rgba(5, 8, 20, 0.35)"
          : "0 8px 18px rgba(15, 23, 42, 0.15)",
    }),
    [mode, token],
  );

  return (
    <Switch
      checked={mode === "dark"}
      onChange={handleChange}
      checkedChildren={<MoonFilled />}
      unCheckedChildren={<SunFilled />}
      aria-label="Toggle dark mode"
      style={switchStyle}
    />
  );
};
