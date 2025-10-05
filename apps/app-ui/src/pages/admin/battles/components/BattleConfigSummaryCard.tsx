import { Badge, Button, Card, Descriptions, Space, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import type { FC } from "react";

import type { BattleConfigDraft } from "../types";

interface BattleConfigSummaryCardProps {
  draft: BattleConfigDraft;
  hasLocalChanges: boolean;
  onPersist: () => Promise<void>;
  onPublish: () => Promise<void>;
  onReset: () => void;
  isPersisting: boolean;
}

export const BattleConfigSummaryCard: FC<BattleConfigSummaryCardProps> = ({
  draft,
  hasLocalChanges,
  onPersist,
  onPublish,
  onReset,
  isPersisting,
}) => {
  const handlePersist = () => {
    void onPersist()
      .then(() => {
        message.success("Draft saved successfully.");
      })
      .catch((error: unknown) => {
        message.error((error as Error).message);
      });
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
        <Descriptions.Item label="Game mode">
          {draft.gameMode ? (
            draft.gameMode
          ) : (
            <Typography.Text type="secondary">Select a mode</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Difficulty">
          {draft.difficulty ? (
            draft.difficulty
          ) : (
            <Typography.Text type="secondary">Set difficulty</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Max players">
          {typeof draft.maxPlayers === "number" ? (
            draft.maxPlayers
          ) : (
            <Typography.Text type="secondary">Define a cap</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Start mode">{draft.startMode}</Descriptions.Item>
        <Descriptions.Item label="Scheduled start">{scheduleLabel}</Descriptions.Item>
        <Descriptions.Item label="Privacy">
          <Space size="small">
            <Typography.Text>{draft.privacy === "invite" ? "Invite only" : "Public"}</Typography.Text>
            {draft.privacy === "invite" && draft.password ? (
              <Tag color="gold">Password protected</Tag>
            ) : null}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Spectators">
          {draft.allowSpectators ? "Allowed" : "Restricted"}
        </Descriptions.Item>
        <Descriptions.Item label="Team balancing">
          {draft.teamBalancing ? "Automatic" : "Manual"}
        </Descriptions.Item>
        <Descriptions.Item label="Rating range">
          {typeof draft.ratingFloor === "number" || typeof draft.ratingCeiling === "number" ? (
            <Typography.Text>
              {typeof draft.ratingFloor === "number" ? draft.ratingFloor : "–"} –
              {typeof draft.ratingCeiling === "number" ? draft.ratingCeiling : "–"}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">No rating filters</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Join queue limit">
          {typeof draft.joinQueueSize === "number" ? (
            draft.joinQueueSize
          ) : (
            <Typography.Text type="secondary">Unlimited</Typography.Text>
          )}
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
        <Descriptions.Item label="Power-ups">
          <Space wrap>
            {draft.powerUps.length ? (
              draft.powerUps.map((powerUp) => <Tag key={powerUp}>{powerUp}</Tag>)
            ) : (
              <Typography.Text type="secondary">No power-ups enabled</Typography.Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Rematch defaults">{draft.rematchDefaults ? "Enabled" : "Disabled"}</Descriptions.Item>
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
      <Space style={{ marginTop: 12 }}>
        <Button
          type="primary"
          onClick={handlePersist}
          disabled={!hasLocalChanges}
          loading={isPersisting}
        >
          Save draft
        </Button>
        <Button onClick={handlePublish} disabled={draft.problems.length === 0 || isPersisting}>
          Publish lobby
        </Button>
        <Button onClick={onReset} disabled={!hasLocalChanges || isPersisting}>
          Reset changes
        </Button>
      </Space>
    </Card>
  );
};
