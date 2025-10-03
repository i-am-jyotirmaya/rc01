import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import type { FormInstance } from "antd";
import type { Dayjs } from "dayjs";
import type { FC } from "react";
import { useMemo } from "react";

type PrivacySetting = "public" | "invite";

type StartMode = "manual" | "scheduled";

type HostBattleFormValues = {
  battleName: string;
  shortDescription?: string;
  gameMode?: string;
  difficulty?: string;
  maxPlayers?: number;
  privacy: PrivacySetting;
  allowSpectators: boolean;
  voiceChat: boolean;
  startMode: StartMode;
  scheduledStartAt?: Dayjs | null;
  turnTimeLimit?: number;
  totalDuration?: number;
  scoringRules?: string;
  tieBreakPreference?: string;
  powerUps?: string[];
  teamBalancing: boolean;
  ratingFloor?: number;
  ratingCeiling?: number;
  moderatorRoles?: string[];
  preloadedResources?: string;
  rematchDefaults: boolean;
  joinQueueSize?: number;
  password?: string;
  linkExpiry?: string;
};

interface HostBattleFormProps {
  form: FormInstance<HostBattleFormValues>;
  showAdvanced: boolean;
  onToggleAdvanced: (checked: boolean) => void;
  onSubmit: (values: HostBattleFormValues) => void;
  submitButtonLabel?: string;
  submitButtonLoading?: boolean;
  onReset?: () => void;
}

const basicSelectOptions = {
  gameModes: [
    { label: "Head-to-head", value: "head-to-head" },
    { label: "Team battle", value: "team" },
    { label: "Battle royale", value: "royale" },
  ],
  difficulty: [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Expert", value: "expert" },
  ],
};

const advancedSelectOptions = {
  scoringRules: [
    { label: "Points per challenge", value: "points-per-challenge" },
    { label: "Time weighted", value: "time-weighted" },
    { label: "First-to-finish", value: "first-to-finish" },
  ],
  tieBreaks: [
    { label: "Fastest submission", value: "fastest-submission" },
    { label: "Highest accuracy", value: "highest-accuracy" },
    { label: "Rematch", value: "rematch" },
  ],
  powerUps: [
    { label: "Hint reveal", value: "hint" },
    { label: "Time freeze", value: "time-freeze" },
    { label: "Double points", value: "double-points" },
  ],
  moderatorRoles: [
    { label: "Judge", value: "judge" },
    { label: "Streamer", value: "streamer" },
    { label: "Scorekeeper", value: "scorekeeper" },
  ],
  resources: [
    { label: "Starter template", value: "starter-template" },
    { label: "Sample data pack", value: "sample-data" },
    { label: "Benchmark suite", value: "benchmark" },
  ],
  linkExpiry: [
    { label: "Never", value: "never" },
    { label: "24 hours", value: "24h" },
    { label: "7 days", value: "7d" },
    { label: "Custom", value: "custom" },
  ],
};

export const HostBattleForm: FC<HostBattleFormProps> = ({
  form,
  showAdvanced,
  onToggleAdvanced,
  onSubmit,
  submitButtonLabel = "Create battle",
  submitButtonLoading = false,
  onReset,
}) => {
  const initialValues = useMemo<Partial<HostBattleFormValues>>(
    () => ({
      privacy: "public",
      allowSpectators: true,
      voiceChat: false,
      startMode: "manual",
      teamBalancing: true,
      rematchDefaults: false,
    }),
    [],
  );

  const fieldColProps = useMemo(
    () => ({
      xs: 24,
      md: 12,
    }),
    [],
  );

  const advancedColProps = useMemo(
    () => ({
      xs: 24,
      md: 12,
      lg: 8,
    }),
    [],
  );

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      requiredMark="optional"
    >
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        Battle basics
      </Typography.Title>
      <Row gutter={[16, 16]} align="top">
        <Col {...fieldColProps}>
          <Form.Item
            name="battleName"
            label="Battle name"
            rules={[{ required: true, message: "Give your battle a name." }]}
          >
            <Input placeholder="Friday Night Algorithms" allowClear />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="shortDescription" label="Short description">
            <Input placeholder="Add a quick pitch for players" allowClear />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="gameMode" label="Game mode">
            <Select
              placeholder="Select a mode"
              popupClassName="host-battle-select-dropdown"
              options={basicSelectOptions.gameModes}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="difficulty" label="Difficulty">
            <Select
              placeholder="Select difficulty"
              popupClassName="host-battle-select-dropdown"
              options={basicSelectOptions.difficulty}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="maxPlayers" label="Max players">
            <InputNumber min={2} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="privacy" label="Privacy">
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value="public">Public</Radio.Button>
              <Radio.Button value="invite">Invite only</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item
            name="allowSpectators"
            label="Allow spectators"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="voiceChat" label="Voice chat" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item name="startMode" label="Battle launch mode">
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value="manual">Manual start</Radio.Button>
              <Radio.Button value="scheduled">Scheduled start</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col {...fieldColProps}>
          <Form.Item shouldUpdate noStyle>
            {() => {
              const mode = form.getFieldValue("startMode") as StartMode;
              return (
                <Form.Item
                  name="scheduledStartAt"
                  label="Scheduled start time"
                  rules={
                    mode === "scheduled"
                      ? [
                          {
                            required: true,
                            message: "Select a start time for the scheduled launch.",
                          },
                        ]
                      : []
                  }
                >
                  <DatePicker
                    showTime
                    style={{ width: "100%" }}
                    disabled={mode !== "scheduled"}
                    allowClear
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Checkbox checked={showAdvanced} onChange={(event) => onToggleAdvanced(event.target.checked)}>
        Show advanced options
      </Checkbox>

      {showAdvanced ? (
        <Space direction="vertical" size={24} style={{ width: "100%", marginTop: 16 }}>
          <Typography.Title level={5} style={{ marginBottom: 0 }}>
            Advanced settings
          </Typography.Title>
          <Row gutter={[16, 16]} align="top">
            <Col {...advancedColProps}>
              <Form.Item name="turnTimeLimit" label="Turn time limit (seconds)">
                <InputNumber min={10} max={600} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="totalDuration" label="Total battle duration (minutes)">
                <InputNumber min={5} max={240} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="scoringRules" label="Scoring rules">
                <Select
                  placeholder="Choose scoring rules"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.scoringRules}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="tieBreakPreference" label="Tie-break preference">
                <Select
                  placeholder="Choose tie-breaker"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.tieBreaks}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="powerUps" label="Power-up pool">
                <Select
                  mode="multiple"
                  placeholder="Select power-ups"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.powerUps}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="teamBalancing" label="Team balancing" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="ratingFloor" label="Player rating floor">
                <InputNumber min={0} max={5000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="ratingCeiling" label="Player rating ceiling">
                <InputNumber min={0} max={5000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="moderatorRoles" label="Moderator roles">
                <Select
                  mode="multiple"
                  placeholder="Assign moderators"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.moderatorRoles}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="preloadedResources" label="Pre-loaded resources">
                <Select
                  placeholder="Select resources"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.resources}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="rematchDefaults" label="Rematch defaults" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="joinQueueSize" label="Queue size for join requests">
                <InputNumber min={0} max={200} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const privacy = form.getFieldValue("privacy") as PrivacySetting;
                  // Keep password disabled until "Invite only" is selected so users understand the dependency.
                  return (
                    <Form.Item name="password" label="Password">
                      <Input.Password
                        placeholder={privacy === "invite" ? "Share a secure password" : "Invite only required"}
                        disabled={privacy !== "invite"}
                        allowClear
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col {...advancedColProps}>
              <Form.Item name="linkExpiry" label="Link expiry">
                <Select
                  placeholder="Choose expiry"
                  popupClassName="host-battle-select-dropdown"
                  options={advancedSelectOptions.linkExpiry}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ) : null}

      <Form.Item shouldUpdate style={{ marginTop: 32 }}>
        {() => (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                if (onReset) {
                  onReset();
                } else {
                  form.resetFields();
                  onToggleAdvanced(false);
                }
              }}
            >
              Reset
            </Button>
            <Button type="primary" htmlType="submit" loading={submitButtonLoading}>
              {submitButtonLabel}
            </Button>
          </Space>
        )}
      </Form.Item>
    </Form>
  );
};

export type { HostBattleFormValues, StartMode };


