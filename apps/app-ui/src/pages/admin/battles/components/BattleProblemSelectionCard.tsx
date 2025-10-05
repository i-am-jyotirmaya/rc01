import { useMemo, useState } from 'react';

import { Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import type { ProblemMetadata } from '@rc01/api-client';

import type { BattleConfigDraft, BattleProblemSummary, ProblemCatalogEntry } from '../types';
import { AddProblemModal } from './AddProblemModal';
import { ProblemPreviewDrawer } from './ProblemPreviewDrawer';

interface BattleProblemSelectionCardProps {
  draft: BattleConfigDraft;
  availableProblems: ProblemCatalogEntry[];
  isLoading: boolean;
  onToggleProblem: (problem: BattleProblemSummary) => void;
  onRefresh: () => void;
  onReplaceProblem: (previousId: string, nextProblem: BattleProblemSummary) => void;
}

const renderProblem = (
  problem: ProblemCatalogEntry,
  isSelected: boolean,
  onToggle: () => void,
  onPreview: () => void,
) => {
  const metadataPieces: string[] = [];
  if (problem.lastModifiedAt) {
    metadataPieces.push('Updated ' + dayjs(problem.lastModifiedAt).format('YYYY-MM-DD HH:mm'));
  }

  return (
    <List.Item
      actions={[
        <Button key="preview" type="link" onClick={onPreview} size="small">
          Preview
        </Button>,
        <Button key="toggle" type={isSelected ? 'primary' : 'default'} onClick={onToggle} size="small">
          {isSelected ? 'Remove' : 'Add'}
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space size="small">
            <Typography.Text strong>{problem.title}</Typography.Text>
            <Tag color={isSelected ? 'gold' : 'default'}>{problem.difficulty}</Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space wrap size="small">
              {problem.source ? (
                <Tag color="geekblue">Source: {problem.source}</Tag>
              ) : null}
              {problem.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {problem.estimatedDurationMinutes ? (
                <Typography.Text type="secondary">{'~' + problem.estimatedDurationMinutes + ' min'}</Typography.Text>
              ) : null}
            </Space>
            {problem.author ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Author: {problem.author}
              </Typography.Text>
            ) : null}
            {metadataPieces.length ? (
              <Typography.Text type="secondary">{metadataPieces.join(' · ')}</Typography.Text>
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
  onReplaceProblem,
}: BattleProblemSelectionCardProps) => {
  const [isAddProblemModalOpen, setAddProblemModalOpen] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const handleModalClose = () => {
    setAddProblemModalOpen(false);
  };

  const handleProblemCreated = async () => {
    await Promise.resolve(onRefresh());
  };

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (!availableProblems.length) {
      return <Empty description="No problems yet. Add one using the template workflow." />;
    }

    return (
      <List
        dataSource={availableProblems}
        renderItem={(problem) => {
          const isSelected = draft.problems.some((candidate) => candidate.id === problem.id);
          return renderProblem(
            problem,
            isSelected,
            () => onToggleProblem(problem),
            () => setPreviewSlug(problem.id),
          );
        }}
      />
    );
  };

  const selectedProblemMetadata = useMemo(
    () => availableProblems.find((problem) => problem.id === previewSlug) ?? null,
    [availableProblems, previewSlug],
  );

  const handleProblemSaved = async (
    previousSlug: string,
    updatedProblem: ProblemMetadata,
  ): Promise<void> => {
    await Promise.resolve(onRefresh());

    const summary: BattleProblemSummary = {
      id: updatedProblem.slug,
      title: updatedProblem.title,
      difficulty: updatedProblem.difficulty,
      tags: updatedProblem.tags,
      estimatedDurationMinutes: updatedProblem.estimatedDurationMinutes,
    };

    if (draft.problems.some((problem) => problem.id === previousSlug)) {
      onReplaceProblem(previousSlug, summary);
    }

    setPreviewSlug(updatedProblem.slug);
  };

  return (
    <>
      <Card
        title="Problem catalog"
        extra={
          <Space>
            <Button type="primary" onClick={() => setAddProblemModalOpen(true)} size="small">
              Add problem
            </Button>
            <Button onClick={onRefresh} size="small" disabled={isLoading}>
              Refresh
            </Button>
          </Space>
        }
      >
        {renderContent()}
      </Card>
      <AddProblemModal
        open={isAddProblemModalOpen}
        onClose={handleModalClose}
        onCreated={handleProblemCreated}
      />
      <ProblemPreviewDrawer
        open={Boolean(previewSlug)}
        problemSlug={previewSlug}
        initialMetadata={selectedProblemMetadata}
        onClose={() => setPreviewSlug(null)}
        onProblemSaved={handleProblemSaved}
      />
    </>
  );
};
