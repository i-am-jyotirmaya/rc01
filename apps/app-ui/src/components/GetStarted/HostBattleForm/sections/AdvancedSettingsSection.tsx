import { Col, Form, InputNumber, Input, Row, Select, Space, Switch, Typography } from "antd";
import type { FormInstance } from "antd";
import type { FC } from "react";
import { advancedSelectOptions, advancedColProps } from "../formOptions";
import type {
  HostBattleFormValues,
  VisibilitySetting,
} from "../../../../features/hostBattle/types";

interface AdvancedSettingsSectionProps {
  form: FormInstance<HostBattleFormValues>;
  visible: boolean;
}

export const AdvancedSettingsSection: FC<AdvancedSettingsSectionProps> = ({ form, visible }) => {
  if (!visible) {
    return null;
  }

  return (
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
              const visibility = form.getFieldValue("visibility") as VisibilitySetting;
              return (
                <Form.Item name="password" label="Password">
                  <Input.Password
                    placeholder={
                      visibility === "password"
                        ? "Share a secure password"
                        : "Password only required for password battles"
                    }
                    disabled={visibility !== "password"}
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
  );
};
