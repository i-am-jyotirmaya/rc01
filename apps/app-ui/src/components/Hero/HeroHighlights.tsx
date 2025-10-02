import { Card, Col, Row, Space, Typography, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import type { HeroHighlight } from "../../features/arena/arenaSlice";
import { useThemeMode } from "../../providers/theme-mode-context";
import { IconFactory } from "../common/IconFactory";

const { Text } = Typography;

interface HeroHighlightsProps {
  highlights: HeroHighlight[];
}

export const HeroHighlights: FC<HeroHighlightsProps> = ({ highlights }) => {
  const { token } = theme.useToken();
  const { mode } = useThemeMode();

  const containerStyle = useMemo(
    () => ({
      marginTop: token.marginXXL,
    }),
    [token],
  );

  const cardStyle = useMemo(
    () => ({
      borderRadius: token.borderRadiusLG,
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow:
        mode === "dark"
          ? "0 18px 40px rgba(5, 8, 20, 0.45)"
          : "0 18px 40px rgba(15, 23, 42, 0.12)",
      height: "100%",
    }),
    [mode, token],
  );

  const cardBodyStyle = useMemo(
    () => ({
      padding: token.paddingLG,
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

  const titleStyle = useMemo(
    () => ({
      display: "block",
      fontWeight: 600,
      color: token.colorText,
    }),
    [token],
  );

  const descriptionStyle = useMemo(
    () => ({
      display: "block",
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
    }),
    [token],
  );

  return (
    <Row gutter={[24, 24]} style={containerStyle}>
      {highlights.map((highlight) => (
        <Col xs={24} md={8} key={highlight.id}>
          <Card bordered={false} style={cardStyle} bodyStyle={cardBodyStyle}>
            <Space size="middle" align="start">
              <IconFactory icon={highlight.icon} style={iconStyle} />
              <div>
                <Text style={titleStyle}>{highlight.title}</Text>
                <Text style={descriptionStyle}>{highlight.description}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
