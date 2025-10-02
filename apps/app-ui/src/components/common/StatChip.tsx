import { Space, Typography, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import type { HeroStat } from "../../features/arena/arenaSlice";
import { useThemeMode } from "../../providers/theme-mode-context";
import { IconFactory } from "./IconFactory";

const { Text } = Typography;

interface StatChipProps {
  stat: HeroStat;
}

export const StatChip: FC<StatChipProps> = ({ stat }) => {
  const { token } = theme.useToken();
  const { mode } = useThemeMode();

  const containerStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      gap: token.marginSM,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorPrimaryBorder}`,
      background: mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(5, 8, 20, 0.05)",
      backdropFilter: "blur(12px)",
    }),
    [mode, token],
  );

  const iconStyle = useMemo(
    () => ({
      fontSize: token.fontSizeHeading3,
      color: token.colorWarning,
    }),
    [token],
  );

  const labelStyle = useMemo(
    () => ({
      display: "block",
      fontSize: token.fontSizeSM,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: token.colorTextSecondary,
    }),
    [token],
  );

  const valueStyle = useMemo(
    () => ({
      display: "block",
      fontSize: token.fontSizeLG,
      color: token.colorText,
    }),
    [token],
  );

  return (
    <Space style={containerStyle} size={token.marginSM} align="center">
      <IconFactory icon={stat.icon} style={iconStyle} />
      <div>
        <Text style={labelStyle}>{stat.label}</Text>
        <Text style={valueStyle}>{stat.value}</Text>
      </div>
    </Space>
  );
};
