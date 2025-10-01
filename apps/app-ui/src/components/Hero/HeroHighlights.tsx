import { Card, Col, Row, Space, Typography, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import type { HeroHighlight } from "../../features/arena/arenaSlice";
import { IconFactory } from "../common/IconFactory";

const { Text } = Typography;

interface HeroHighlightsProps {
  highlights: HeroHighlight[];
}

export const HeroHighlights: FC<HeroHighlightsProps> = ({ highlights }) => {
  const { token } = theme.useToken();

  const containerStyle = useMemo(
    () => ({
      marginTop: token.marginXXL,
    }),
    [token],
  );

  const cardStyle = useMemo(
    () => ({
      borderRadius: token.borderRadiusLG,
      background: "rgba(5, 8, 20, 0.92)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      height: "100%",
    }),
    [token],
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
      color: token.colorTextLightSolid,
    }),
    [token],
  );

  const descriptionStyle = useMemo(
    () => ({
      display: "block",
      color: "rgba(240, 245, 255, 0.65)",
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
