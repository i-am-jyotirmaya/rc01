import { Divider, Form, Typography } from "antd";
import type { FormInstance } from "antd";
import type { FC } from "react";
import { useCallback, useMemo } from "react";
import type { HostBattleFormValues } from "../../../features/hostBattle/types";
import { baseFormDefaults } from "../../../features/hostBattle/utils";
import { AdvancedSettingsSection } from "./sections/AdvancedSettingsSection";
import { AdvancedToggle } from "./sections/AdvancedToggle";
import { BasicSettingsSection } from "./sections/BasicSettingsSection";
import { FormActions } from "./sections/FormActions";

export interface HostBattleFormProps {
  form: FormInstance<HostBattleFormValues>;
  showAdvanced: boolean;
  onToggleAdvanced: (checked: boolean) => void;
  onSubmit: (values: HostBattleFormValues) => void;
  submitButtonLabel?: string;
  submitButtonLoading?: boolean;
  onReset?: () => void;
}

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
      ...baseFormDefaults,
    }),
    [],
  );

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
      return;
    }

    form.resetFields();
    onToggleAdvanced(false);
  }, [form, onReset, onToggleAdvanced]);

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
      <BasicSettingsSection form={form} />
      <Divider />
      <AdvancedToggle checked={showAdvanced} onChange={onToggleAdvanced} />
      <AdvancedSettingsSection form={form} visible={showAdvanced} />
      <FormActions
        onReset={handleReset}
        submitButtonLabel={submitButtonLabel}
        submitButtonLoading={submitButtonLoading}
      />
    </Form>
  );
};
