import { Typography } from "antd";
import type { FC } from "react";
import { Link } from "react-router-dom";
import type { HostBattleVisualConfig } from "../hooks/useHostBattleVisualConfig";

const { Title, Paragraph, Text } = Typography;

interface BattleHeroProps {
  visual: HostBattleVisualConfig;
}

export const BattleHero: FC<BattleHeroProps> = ({ visual }) => (
  <div style={visual.styles.headerStyle}>
    <Title level={2} style={{ margin: 0, color: visual.palette.headingColor }}>
      Host your own battle
    </Title>
    <Paragraph style={{ margin: 0, color: visual.palette.bodyTextColor }}>
      Configure the rules, invite your competitors, and tailor the experience before you go live. Everything updates
      instantly so you can share the lobby the moment it feels ready.
    </Paragraph>
    <Text style={{ color: visual.palette.linkHintColor }}>
      Prefer to join an existing competition? <Link to="/" style={{ color: visual.accentColor }}>Return to the lobby</Link>
      to paste an invite link or code.
    </Text>
  </div>
);
