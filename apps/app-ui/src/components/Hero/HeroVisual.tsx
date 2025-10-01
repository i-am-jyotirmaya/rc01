import { Card, Space, Typography, theme } from "antd";
import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import type { HeroContent } from "../../features/arena/arenaSlice";
import { IconFactory } from "../common/IconFactory";

const { Text } = Typography;

interface HeroVisualProps {
  hero: HeroContent;
}

export const HeroVisual: FC<HeroVisualProps> = ({ hero }) => {
  const { token } = theme.useToken();

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      minHeight: 420,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [],
  );

  const orbBaseStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: "50%",
      filter: "blur(60px)",
      opacity: 0.8,
    }),
    [],
  );

  const leftOrbStyle = useMemo(
    () => ({
      ...orbBaseStyle,
      top: "15%",
      left: "5%",
      background: "rgba(250, 219, 20, 0.6)",
    }),
    [orbBaseStyle],
  );

  const rightOrbStyle = useMemo(
    () => ({
      ...orbBaseStyle,
      bottom: "10%",
      right: "5%",
      background: "rgba(114, 109, 214, 0.55)",
    }),
    [orbBaseStyle],
  );

  const glassStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      width: "min(420px, 90%)",
      padding: `${token.paddingXL}px`,
      borderRadius: 20,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      background: "linear-gradient(140deg, rgba(12, 16, 36, 0.85), rgba(12, 16, 36, 0.65))",
      boxShadow: "0 24px 60px rgba(8, 10, 25, 0.45)",
      backdropFilter: "blur(18px)",
      zIndex: 1,
    }),
    [token],
  );

  const glassHeaderStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      gap: token.marginXS,
      marginBottom: token.marginMD,
    }),
    [token],
  );

  const glassDotStyle = useMemo<CSSProperties>(
    () => ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      display: "inline-block",
    }),
    [],
  );

  const codeStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      fontFamily: '"Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: "0.95rem",
      color: "rgba(244, 248, 255, 0.9)",
      whiteSpace: "pre-wrap" as const,
    }),
    [],
  );

  const featureCardStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      bottom: -32,
      right: "8%",
      width: 260,
      borderRadius: token.borderRadiusLG,
      background: "rgba(5, 8, 20, 0.92)",
      border: "1px solid rgba(250, 219, 20, 0.2)",
      boxShadow: "0 18px 40px rgba(5, 8, 20, 0.55)",
    }),
    [token],
  );

  const featureIconStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: token.fontSizeHeading3,
      color: token.colorWarning,
    }),
    [token],
  );

  const featureTitleStyle = useMemo<CSSProperties>(
    () => ({
      display: "block",
      fontWeight: 600,
      color: token.colorTextLightSolid,
    }),
    [token],
  );

  const featureSubtitleStyle = useMemo<CSSProperties>(
    () => ({
      display: "block",
      color: "rgba(240, 245, 255, 0.65)",
      fontSize: token.fontSizeSM,
    }),
    [token],
  );

  return (
    <div style={containerStyle}>
      <div style={leftOrbStyle} />
      <div style={rightOrbStyle} />
      <div style={glassStyle}>
        <div style={glassHeaderStyle}>
          <span style={{ ...glassDotStyle, background: "#ff5f56" }} />
          <span style={{ ...glassDotStyle, background: "#ffbd2e" }} />
          <span style={{ ...glassDotStyle, background: "#27c93f" }} />
        </div>
        <pre style={codeStyle}>{hero.codeSnippet}</pre>
      </div>
      <Card bordered={false} style={featureCardStyle}>
        <Space size="middle">
          <IconFactory icon={hero.feature.icon} style={featureIconStyle} />
          <div>
            <Text style={featureTitleStyle}>{hero.feature.title}</Text>
            <Text style={featureSubtitleStyle}>{hero.feature.subtitle}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};
