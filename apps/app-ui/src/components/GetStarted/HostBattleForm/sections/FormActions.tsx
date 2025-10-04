import { Button, Form, Space } from "antd";
import type { FC } from "react";

interface FormActionsProps {
  onReset: () => void;
  submitButtonLabel: string;
  submitButtonLoading: boolean;
}

export const FormActions: FC<FormActionsProps> = ({ onReset, submitButtonLabel, submitButtonLoading }) => (
  <Form.Item shouldUpdate style={{ marginTop: 32 }}>
    {() => (
      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onReset}>Reset</Button>
        <Button type="primary" htmlType="submit" loading={submitButtonLoading}>
          {submitButtonLabel}
        </Button>
      </Space>
    )}
  </Form.Item>
);
