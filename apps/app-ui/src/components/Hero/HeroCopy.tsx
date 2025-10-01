import { Button, Space, Tag, Typography, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import type { HeroContent } from "../../features/arena/arenaSlice";
import { IconFactory } from "../common/IconFactory";
import { StatChip } from "../common/StatChip";

const { Title, Paragraph } = Typography;

interface HeroCopyProps {
  hero: HeroContent;
}

export const HeroCopy: FC<HeroCopyProps> = ({ hero }) => {
  const { token } = theme.useToken();

  const copyContainerStyle = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column" as const,
      gap: token.marginXL,
    }),
    [token],
  );

  const pillsContainerStyle = useMemo(
    () => ({
      display: "flex",
      gap: token.marginSM,
      flexWrap: "wrap" as const,
    }),
    [token],
  );

  const pillStyle = useMemo(
    () => ({
      border: "none",
      background: token.colorWarning,
      color: "#050814",
      textTransform: "uppercase" as const,
      fontWeight: 600,
      letterSpacing: "0.04em",
      padding: "0.3rem 0.9rem",
      borderRadius: 999,
      boxShadow: "0 10px 24px rgba(250, 219, 20, 0.22)",
    }),
    [token],
  );

  const titleStyle = useMemo(
    () => ({
      margin: 0,
      fontSize: "clamp(2.8rem, 4vw, 4rem)",
      fontWeight: 800,
      letterSpacing: "0.02em",
      color: token.colorWhite,
    }),
    [token],
  );

  const subtitleStyle = useMemo(
    () => ({
      maxWidth: "32rem",
      fontSize: "1.1rem",
      color: "rgba(240, 245, 255, 0.85)",
    }),
    [],
  );

  const statsContainerStyle = useMemo(
    () => ({
      display: "flex",
      flexWrap: "wrap" as const,
      gap: token.marginMD,
    }),
    [token],
  );

  return (
    <div style={copyContainerStyle}>
      <Space style={pillsContainerStyle} size={[token.marginSM, token.marginSM]} wrap>
        {hero.pills.map((pill) => (
          <Tag key={pill.id} style={pillStyle}>
            {pill.label}
          </Tag>
        ))}
      </Space>
      <Title level={1} style={titleStyle}>
        {hero.title}
      </Title>
      <Paragraph style={subtitleStyle}>{hero.subtitle}</Paragraph>
      <Space size="large" wrap>
        <Button
          type="primary"
          size="large"
          icon={<IconFactory icon={hero.actions.primary.icon} />}
        >
          {hero.actions.primary.label}
        </Button>
        <Button size="large" ghost>
          {hero.actions.secondary.label}
        </Button>
      </Space>
      <div style={statsContainerStyle}>
        {hero.stats.map((stat) => (
          <StatChip key={stat.id} stat={stat} />
        ))}
      </div>
    </div>
  );
};
