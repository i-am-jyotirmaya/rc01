import { Card, DatePicker, Form, Input, Select, Switch, Typography } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { FC } from "react";

import type { BattleConfigDraft } from "../types";

const { TextArea } = Input;

interface BattleConfigDetailsCardProps {
  draft: BattleConfigDraft;
  onChange: (changes: Partial<BattleConfigDraft>) => void;
  isPersisting?: boolean;
}

const startModeOptions = [
  { label: "Manual launch", value: "manual" },
  { label: "Scheduled", value: "scheduled" },
];

const languageOptions = ["typescript", "python", "rust", "go", "java"].map((language) => ({
  label: language,
  value: language,
}));

export const BattleConfigDetailsCard: FC<BattleConfigDetailsCardProps> = ({
  draft,
  onChange,
  isPersisting,
}) => {
  const scheduledDateValue = draft.scheduledStartAt ? dayjs(draft.scheduledStartAt) : null;

  const handleScheduledChange = (value: Dayjs | null) => {
    onChange({
      startMode: value ? "scheduled" : draft.startMode,
      scheduledStartAt: value ? value.toISOString() : null,
    });
  };

  const handleStartModeChange = (value: BattleConfigDraft["startMode"]) => {
    onChange({
      startMode: value,
      scheduledStartAt: value === "scheduled" ? draft.scheduledStartAt ?? new Date().toISOString() : null,
    });
  };

  return (
    <Card title="Battle details" extra={<Typography.Text type="secondary">BATT-001</Typography.Text>}>
      <Form layout="vertical" disabled={isPersisting}>
        <Form.Item label="Battle name" required>
          <Input
            value={draft.name}
            placeholder="Enter display name"
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Form.Item>
        <Form.Item label="Short description">
          <TextArea
            value={draft.shortDescription}
            placeholder="What should participants know before joining?"
            autoSize={{ minRows: 3, maxRows: 5 }}
            onChange={(event) => onChange({ shortDescription: event.target.value })}
          />
        </Form.Item>
        <Form.Item label="Start mode">
          <Select
            value={draft.startMode}
            options={startModeOptions}
            onChange={handleStartModeChange}
          />
        </Form.Item>
        <Form.Item label="Scheduled start" extra="Visible when start mode is scheduled.">
          <DatePicker
            value={scheduledDateValue}
            showTime
            onChange={handleScheduledChange}
            disabled={draft.startMode !== "scheduled"}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="Primary language pool">
          <Select
            mode="multiple"
            allowClear
            placeholder="Choose permitted languages"
            value={draft.primaryLanguagePool}
            options={languageOptions}
            onChange={(value) => onChange({ primaryLanguagePool: value })}
          />
        </Form.Item>
        <Form.Item label="Battle notes" extra="Private notes for the admin team.">
          <TextArea
            value={draft.notes}
            placeholder="Add reminders or TODOs for the battle crew"
            autoSize={{ minRows: 2, maxRows: 6 }}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </Form.Item>
        <Form.Item label="Participation controls">
          <Switch
            checked={draft.allowSpectators}
            checkedChildren="Spectators enabled"
            unCheckedChildren="Spectators disabled"
            onChange={(value) => onChange({ allowSpectators: value })}
            style={{ marginRight: 12 }}
          />
          <Switch
            checked={draft.voiceChat}
            checkedChildren="Voice chat on"
            unCheckedChildren="Voice chat off"
            onChange={(value) => onChange({ voiceChat: value })}
            style={{ marginRight: 12 }}
          />
          <Switch
            checked={draft.teamBalancing}
            checkedChildren="Balance teams"
            unCheckedChildren="Manual teams"
            onChange={(value) => onChange({ teamBalancing: value })}
          />
        </Form.Item>
      </Form>
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        TODO: sync field updates with battle configuration API when SV-001 unlocks backend endpoints.
      </Typography.Paragraph>
    </Card>
  );
};
