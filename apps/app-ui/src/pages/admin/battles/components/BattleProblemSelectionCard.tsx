import { useState } from 'react';

import { Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import type { BattleConfigDraft, BattleProblemSummary, ProblemCatalogEntry } from '../types';
import { AddProblemModal } from './AddProblemModal';

interface BattleProblemSelectionCardProps {
  draft: BattleConfigDraft;
  availableProblems: ProblemCatalogEntry[];
  isLoading: boolean;
  onToggleProblem: (problem: BattleProblemSummary) => void;
  onRefresh: () => void;
}

const renderProblem = (problem: ProblemCatalogEntry, isSelected: boolean, onToggle: () => void) => {
  const metadataPieces: string[] = [];
  if (problem.author) {
    metadataPieces.push('Author: ' + problem.author);
  }
  if (problem.lastModifiedAt) {
    metadataPieces.push('Updated ' + dayjs(problem.lastModifiedAt).format('YYYY-MM-DD HH:mm'));
  }

  return (
    <List.Item
      actions={[
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
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Space wrap size="small">
              {problem.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {problem.estimatedDurationMinutes ? (
                <Typography.Text type="secondary">{'~' + problem.estimatedDurationMinutes + ' min'}</Typography.Text>
              ) : null}
            </Space>
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
}: BattleProblemSelectionCardProps) => {
  const [isAddProblemModalOpen, setAddProblemModalOpen] = useState(false);

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
          return renderProblem(problem, isSelected, () => onToggleProblem(problem));
        }}
      />
    );
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
    </>
  );
};
