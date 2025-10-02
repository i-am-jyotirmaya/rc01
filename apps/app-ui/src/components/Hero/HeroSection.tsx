import { Col, Layout, Row, theme } from "antd";
import type { FC } from "react";
import { useMemo } from "react";
import { selectHeroContent } from "../../features/arena/arenaSlice";
import { useAppSelector } from "../../store/hooks";
import { HeroCopy } from "./HeroCopy";
import { HeroHighlights } from "./HeroHighlights";
import { HeroVisual } from "./HeroVisual";

const { Content } = Layout;

export const HeroSection: FC = () => {
  const heroContent = useAppSelector(selectHeroContent);
  const { token } = theme.useToken();

  const contentStyle = useMemo(
    () => ({
      padding: "clamp(64px, 8vw, 120px) clamp(32px, 8vw, 96px)",
      position: "relative" as const,
      overflow: "hidden",
      color: token.colorText,
    }),
    [token],
  );

  return (
    <Content style={contentStyle}>
      <Row gutter={[48, 48]} align="middle">
        <Col xs={24} lg={12}>
          <HeroCopy hero={heroContent} />
        </Col>
        <Col xs={24} lg={12}>
          <HeroVisual hero={heroContent} />
        </Col>
      </Row>
      <HeroHighlights highlights={heroContent.highlights} />
    </Content>
  );
};
