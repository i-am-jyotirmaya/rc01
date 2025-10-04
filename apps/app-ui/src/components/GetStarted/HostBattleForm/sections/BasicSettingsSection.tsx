import { Col, DatePicker, Form, Input, InputNumber, Radio, Row, Select, Switch } from "antd";
import type { FormInstance } from "antd";
import type { FC } from "react";
import { basicSelectOptions, fieldColProps } from "../formOptions";
import type { HostBattleFormValues, StartMode } from "../../../features/hostBattle/types";

interface BasicSettingsSectionProps {
  form: FormInstance<HostBattleFormValues>;
}

export const BasicSettingsSection: FC<BasicSettingsSectionProps> = ({ form }) => (
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
      <Form.Item name="allowSpectators" label="Allow spectators" valuePropName="checked">
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
              <DatePicker showTime style={{ width: "100%" }} disabled={mode !== "scheduled"} allowClear />
            </Form.Item>
          );
        }}
      </Form.Item>
    </Col>
  </Row>
);
