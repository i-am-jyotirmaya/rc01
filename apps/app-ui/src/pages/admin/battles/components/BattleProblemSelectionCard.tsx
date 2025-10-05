import { useCallback } from "react";

import { Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import type { ProblemMetadata } from "@rc01/api-client";

import type { BattleConfigDraft, BattleProblemSummary } from "../types";

interface BattleProblemSelectionCardProps {
  draft: BattleConfigDraft;
  availableProblems: ProblemMetadata[];
  isLoading: boolean;
  onToggleProblem: (problem: BattleProblemSummary) => void;
  onRefresh: () => void;
}

const renderProblem = (
  problem: ProblemMetadata,
  isSelected: boolean,
  onToggle: () => void,
  onOpen: () => void,
) => {
  const metadataPieces: string[] = [];
  if (problem.updatedAt) {
    metadataPieces.push("Updated " + dayjs(problem.updatedAt).format("YYYY-MM-DD HH:mm"));
  }

  return (
    <List.Item
      actions={[
        <Button key="open" type="link" onClick={onOpen} size="small">
          Manage
        </Button>,
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
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space wrap size="small">
              {problem.source ? (
                <Tag color="geekblue">Source: {problem.source}</Tag>
              ) : null}
              {problem.tags.map((tag: string) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {problem.estimatedDurationMinutes ? (
                <Typography.Text type="secondary">{"~" + problem.estimatedDurationMinutes + " min"}</Typography.Text>
              ) : null}
            </Space>
            {problem.author ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Author: {problem.author}
              </Typography.Text>
            ) : null}
            {metadataPieces.length ? (
              <Typography.Text type="secondary">{metadataPieces.join(" · ")}</Typography.Text>
            ) : null}
          </Space>
        }
      />
    </List.Item>
  );
};

export const BattleProblemSelectionCard = ({
  draft,
  availableProblems,
  isLoading,
  onToggleProblem,
  onRefresh,
}: BattleProblemSelectionCardProps) => {
  const navigate = useNavigate();

  const toBattleProblemSummary = useCallback(
    (problem: ProblemMetadata): BattleProblemSummary => ({
      id: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      estimatedDurationMinutes: problem.estimatedDurationMinutes,
    }),
    [],
  );

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (!availableProblems.length) {
      return <Empty description="No problems yet. Use the Problems page to add one." />;
    }

    return (
      <List
        dataSource={availableProblems}
        renderItem={(problem) => {
          const isSelected = draft.problems.some((candidate) => candidate.id === problem.slug);
          const summary = toBattleProblemSummary(problem);
          return renderProblem(
            problem,
            isSelected,
            () => onToggleProblem(summary),
            () => navigate(`/admin/problems/${problem.slug}`),
          );
        }}
      />
    );
  };

  return (
    <Card
      title="Problem catalog"
      extra={
        <Space>
          <Button type="primary" onClick={() => navigate("/admin/problems")} size="small">
            Manage library
          </Button>
          <Button onClick={onRefresh} size="small" disabled={isLoading}>
            Refresh
          </Button>
        </Space>
      }
    >
      {renderContent()}
    </Card>
  );
};
