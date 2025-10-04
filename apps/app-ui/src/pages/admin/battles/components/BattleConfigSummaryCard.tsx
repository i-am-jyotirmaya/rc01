import { Badge, Button, Card, Descriptions, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { FC } from "react";

import type { BattleConfigDraft } from "../types";

interface BattleConfigSummaryCardProps {
  draft: BattleConfigDraft;
  hasLocalChanges: boolean;
  onPersist: () => Promise<void>;
  onPublish: () => Promise<void>;
  onReset: () => void;
}

export const BattleConfigSummaryCard: FC<BattleConfigSummaryCardProps> = ({
  draft,
  hasLocalChanges,
  onPersist,
  onPublish,
  onReset,
}) => {
  const handlePersist = () => {
    void onPersist();
  };

  const handlePublish = () => {
    void onPublish();
  };

  const scheduleLabel =
    draft.startMode === "scheduled" && draft.scheduledStartAt
      ? dayjs(draft.scheduledStartAt).format("MMM D, YYYY h:mm A")
      : "Manual";

  return (
    <Card title="Configuration status" extra={<Badge status="processing" text={draft.status} />}> 
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Battle name">{draft.name || "Untitled battle"}</Descriptions.Item>
        <Descriptions.Item label="Start mode">{draft.startMode}</Descriptions.Item>
        <Descriptions.Item label="Scheduled start">{scheduleLabel}</Descriptions.Item>
        <Descriptions.Item label="Spectators">
          {draft.allowSpectators ? "Allowed" : "Restricted"}
        </Descriptions.Item>
        <Descriptions.Item label="Team balancing">
          {draft.teamBalancing ? "Automatic" : "Manual"}
        </Descriptions.Item>
        <Descriptions.Item label="Languages">
          <Space wrap>
            {draft.primaryLanguagePool.length ? (
              draft.primaryLanguagePool.map((language) => <Tag key={language}>{language}</Tag>)
            ) : (
              <Typography.Text type="secondary">Add allowed languages</Typography.Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Problems">
          <Space direction="vertical">
            {draft.problems.map((problem) => (
              <Typography.Text key={problem.id}>
                • {problem.title} ({problem.difficulty})
              </Typography.Text>
            ))}
            {!draft.problems.length ? (
              <Typography.Text type="secondary">Attach problems from catalog</Typography.Text>
            ) : null}
          </Space>
        </Descriptions.Item>
      </Descriptions>
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        TODO: wire up persist/publish actions to backend mutation endpoints.
      </Typography.Paragraph>
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={handlePersist} disabled={!hasLocalChanges}>
          Save draft
        </Button>
        <Button onClick={handlePublish} disabled={draft.problems.length === 0}>
          Publish lobby
        </Button>
        <Button onClick={onReset} disabled={!hasLocalChanges}>
          Reset changes
        </Button>
      </Space>
    </Card>
  );
};
