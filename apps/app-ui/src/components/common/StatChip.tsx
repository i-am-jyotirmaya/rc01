import { Space, Typography, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import type { HeroStat } from "../../features/arena/arenaSlice";
import { IconFactory } from "./IconFactory";

const { Text } = Typography;

interface StatChipProps {
  stat: HeroStat;
}

export const StatChip: FC<StatChipProps> = ({ stat }) => {
  const { token } = theme.useToken();

  const containerStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      gap: token.marginSM,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorPrimaryBorder}`,
      background: "rgba(255, 255, 255, 0.04)",
      backdropFilter: "blur(12px)",
    }),
    [token],
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
      color: "rgba(240, 245, 255, 0.6)",
    }),
    [token],
  );

  const valueStyle = useMemo(
    () => ({
      display: "block",
      fontSize: token.fontSizeLG,
      color: token.colorTextLightSolid,
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
