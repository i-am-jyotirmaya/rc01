import { Card, Form, InputNumber, Select, Switch, Typography, Input } from "antd";
import type { FC } from "react";

import type { BattleConfigDraft } from "../types";

const scoringRuleOptions = [
  { label: "Points per challenge", value: "points-per-challenge" },
  { label: "Time weighted", value: "time-weighted" },
  { label: "First-to-finish", value: "first-to-finish" },
];

const tieBreakOptions = [
  { label: "Fastest submission", value: "fastest-submission" },
  { label: "Highest accuracy", value: "highest-accuracy" },
  { label: "Rematch", value: "rematch" },
];

const powerUpOptions = [
  { label: "Hint reveal", value: "hint" },
  { label: "Time freeze", value: "time-freeze" },
  { label: "Double points", value: "double-points" },
];

const moderatorOptions = [
  { label: "Judge", value: "judge" },
  { label: "Streamer", value: "streamer" },
  { label: "Scorekeeper", value: "scorekeeper" },
];

const resourceOptions = [
  { label: "Starter template", value: "starter-template" },
  { label: "Sample data pack", value: "sample-data" },
  { label: "Benchmark suite", value: "benchmark" },
];

const linkExpiryOptions = [
  { label: "Never", value: "never" },
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "Custom", value: "custom" },
];

interface BattleConfigAdvancedCardProps {
  draft: BattleConfigDraft;
  onChange: (changes: Partial<BattleConfigDraft>) => void;
  isPersisting?: boolean;
}

export const BattleConfigAdvancedCard: FC<BattleConfigAdvancedCardProps> = ({ draft, onChange, isPersisting }) => {
  return (
    <Card title="Advanced controls" extra={<Typography.Text type="secondary">UI-001</Typography.Text>}>
      <Form layout="vertical" disabled={isPersisting}>
        <Form.Item label="Turn time limit (seconds)">
          <InputNumber
            min={10}
            max={600}
            style={{ width: "100%" }}
            value={draft.turnTimeLimit ?? undefined}
            onChange={(value) => onChange({ turnTimeLimit: typeof value === "number" ? value : null })}
          />
        </Form.Item>
        <Form.Item label="Total battle duration (minutes)">
          <InputNumber
            min={5}
            max={240}
            style={{ width: "100%" }}
            value={draft.totalDuration ?? undefined}
            onChange={(value) => onChange({ totalDuration: typeof value === "number" ? value : null })}
          />
        </Form.Item>
        <Form.Item label="Scoring rules">
          <Select
            allowClear
            placeholder="Choose scoring rules"
            value={draft.scoringRules}
            options={scoringRuleOptions}
            onChange={(value: string | undefined) => onChange({ scoringRules: value ?? undefined })}
          />
        </Form.Item>
        <Form.Item label="Tie-break preference">
          <Select
            allowClear
            placeholder="Choose tie-breaker"
            value={draft.tieBreakPreference}
            options={tieBreakOptions}
            onChange={(value: string | undefined) => onChange({ tieBreakPreference: value ?? undefined })}
          />
        </Form.Item>
        <Form.Item label="Power-up pool">
          <Select
            mode="multiple"
            allowClear
            placeholder="Select enabled power-ups"
            value={draft.powerUps}
            options={powerUpOptions}
            onChange={(value: string[]) => onChange({ powerUps: value })}
          />
        </Form.Item>
        <Form.Item label="Player rating floor">
          <InputNumber
            min={0}
            max={5000}
            style={{ width: "100%" }}
            value={draft.ratingFloor ?? undefined}
            onChange={(value) => onChange({ ratingFloor: typeof value === "number" ? value : null })}
          />
        </Form.Item>
        <Form.Item label="Player rating ceiling">
          <InputNumber
            min={0}
            max={5000}
            style={{ width: "100%" }}
            value={draft.ratingCeiling ?? undefined}
            onChange={(value) => onChange({ ratingCeiling: typeof value === "number" ? value : null })}
          />
        </Form.Item>
        <Form.Item label="Moderator roles">
          <Select
            mode="multiple"
            allowClear
            placeholder="Assign moderator roles"
            value={draft.moderatorRoles}
            options={moderatorOptions}
            onChange={(value: string[]) => onChange({ moderatorRoles: value })}
          />
        </Form.Item>
        <Form.Item label="Pre-loaded resources">
          <Select
            allowClear
            placeholder="Surface helpful resources"
            value={draft.preloadedResources}
            options={resourceOptions}
            onChange={(value: string | undefined) => onChange({ preloadedResources: value ?? undefined })}
          />
        </Form.Item>
        <Form.Item label="Rematch defaults" valuePropName="checked">
          <Switch
            checked={draft.rematchDefaults}
            onChange={(value) => onChange({ rematchDefaults: value })}
          />
        </Form.Item>
        <Form.Item label="Queue size for join requests">
          <InputNumber
            min={0}
            max={500}
            style={{ width: "100%" }}
            value={draft.joinQueueSize ?? undefined}
            onChange={(value) => onChange({ joinQueueSize: typeof value === "number" ? value : null })}
          />
        </Form.Item>
        <Form.Item label="Password">
          <Input.Password
            allowClear
            placeholder={draft.privacy === "invite" ? "Share a secure password" : "Invite only required"}
            disabled={draft.privacy !== "invite"}
            value={draft.password}
            onChange={(event) => onChange({ password: event.target.value })}
          />
        </Form.Item>
        <Form.Item label="Link expiry">
          <Select
            allowClear
            placeholder="Choose link expiry"
            value={draft.linkExpiry}
            options={linkExpiryOptions}
            onChange={(value: string | undefined) => onChange({ linkExpiry: value ?? undefined })}
          />
        </Form.Item>
      </Form>
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        Advanced preferences are stored with the draft. Remember to save when you are done making changes.
      </Typography.Paragraph>
    </Card>
  );
};
