import { ConfigProvider } from "antd";
import type { FormInstance } from "antd";
import type { FC } from "react";
import { HostBattleForm } from "../../../components/GetStarted/HostBattleForm";
import type { HostBattleFormValues } from "../../../features/hostBattle/types";
import type { HostBattleVisualConfig } from "../hooks/useHostBattleVisualConfig";

interface BattleFormPanelProps {
  visual: HostBattleVisualConfig;
  form: FormInstance<HostBattleFormValues>;
  showAdvanced: boolean;
  onToggleAdvanced: (checked: boolean) => void;
  onSubmit: (values: HostBattleFormValues) => void;
  submitButtonLoading: boolean;
}

export const BattleFormPanel: FC<BattleFormPanelProps> = ({
  visual,
  form,
  showAdvanced,
  onToggleAdvanced,
  onSubmit,
  submitButtonLoading,
}) => (
  <ConfigProvider theme={visual.styles.formTheme}>
    <div className="host-battle-panel" style={visual.styles.formPanelStyle}>
      <style>{visual.styles.formEnhancementStyles}</style>
      <HostBattleForm
        form={form}
        showAdvanced={showAdvanced}
        onToggleAdvanced={onToggleAdvanced}
        onSubmit={onSubmit}
        submitButtonLoading={submitButtonLoading}
      />
    </div>
  </ConfigProvider>
);
