import { Divider, Space, Tag, Typography, theme } from "antd";
import type { FC } from "react";
import type { HostBattleVisualConfig } from "../hooks/useHostBattleVisualConfig";

const { Title, Paragraph, Text } = Typography;

interface BattleSummaryCardProps {
  visual: HostBattleVisualConfig;
}

export const BattleSummaryCard: FC<BattleSummaryCardProps> = ({ visual }) => {
  const { token } = theme.useToken();

  return (
    <div style={visual.styles.summaryCardStyle}>
      <Title level={4} style={{ margin: 0, color: visual.palette.headingColor }}>
        Battle blueprint
      </Title>
      <Paragraph style={{ margin: 0, color: visual.palette.bodyTextColor }}>
        Outline your format, scheduling, and moderation in one pass. You can revisit this setup any time before the battle
        starts.
      </Paragraph>
      <Space size={[token.marginSM, token.marginSM]} wrap>
        <Tag style={visual.styles.tagStyle}>Real-time control</Tag>
        <Tag style={visual.styles.tagStyle}>Private or public</Tag>
        <Tag style={visual.styles.tagStyle}>Power-up pools</Tag>
      </Space>
      <Divider style={{ margin: `${token.marginMD}px 0`, borderColor: visual.palette.dividerColor }} />
      <Paragraph strong style={{ margin: 0, color: visual.palette.headingColor }}>
        Setup checklist
      </Paragraph>
      <ul style={visual.styles.highlightListStyle}>
        <li>Pick battle modes, difficulty, and player limits that match your format.</li>
        <li>Lock down privacy, queue sizing, and moderation so teams join smoothly.</li>
        <li>Enable advanced scoring, power-ups, and resources when you want extra spectacle.</li>
      </ul>
      <Paragraph style={{ margin: 0, color: visual.palette.paragraphMutedColor }}>
        Need inspiration? <Text style={{ color: visual.accentColor }}>Community templates</Text> are dropping soon.
      </Paragraph>
    </div>
  );
};
