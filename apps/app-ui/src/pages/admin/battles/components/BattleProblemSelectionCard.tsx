import { Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from "antd";
import type { FC } from "react";

import type { BattleConfigDraft, BattleProblemSummary } from "../types";

interface BattleProblemSelectionCardProps {
  draft: BattleConfigDraft;
  availableProblems: BattleProblemSummary[];
  isLoading: boolean;
  onToggleProblem: (problem: BattleProblemSummary) => void;
  onRefresh: () => void;
}

const renderProblem = (problem: BattleProblemSummary, isSelected: boolean, onToggle: () => void) => (
  <List.Item
    actions={[
      <Button key="toggle" type={isSelected ? "primary" : "default"} onClick={onToggle} size="small">
        {isSelected ? "Remove" : "Add"}
      </Button>,
    ]}
  >
    <List.Item.Meta
      title={
        <Space size="small">
          <Typography.Text strong>{problem.title}</Typography.Text>
          <Tag color={isSelected ? "gold" : "default"}>{problem.difficulty}</Tag>
        </Space>
      }
      description={
        <Space wrap>
          {problem.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {problem.estimatedDurationMinutes ? (
            <Typography.Text type="secondary">
              ~{problem.estimatedDurationMinutes} min
            </Typography.Text>
          ) : null}
        </Space>
      }
    />
  </List.Item>
);

export const BattleProblemSelectionCard: FC<BattleProblemSelectionCardProps> = ({
  draft,
  availableProblems,
  isLoading,
  onToggleProblem,
  onRefresh,
}) => {
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (!availableProblems.length) {
      return <Empty description="No problems yet. SV-001 will surface catalog entries here." />;
    }

    return (
      <List
        dataSource={availableProblems}
        renderItem={(problem) => {
          const isSelected = draft.problems.some((candidate) => candidate.id === problem.id);
          return renderProblem(problem, isSelected, () => onToggleProblem(problem));
        }}
      />
    );
  };

  return (
    <Card
      title="Problem catalog"
      extra={
        <Button onClick={onRefresh} size="small" disabled={isLoading}>
          Refresh
        </Button>
      }
    >
      {renderContent()}
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        TODO: replace local catalog stub with file-manager service results once available.
      </Typography.Paragraph>
    </Card>
  );
};
