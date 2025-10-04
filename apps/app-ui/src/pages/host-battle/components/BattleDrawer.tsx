import { ConfigProvider, Drawer } from "antd";
import type { FormInstance } from "antd";
import type { FC } from "react";
import { HostBattleForm } from "../../../components/GetStarted/HostBattleForm";
import type { HostBattleFormValues } from "../../../features/hostBattle/types";
import type { HostBattleVisualConfig } from "../hooks/useHostBattleVisualConfig";

interface BattleDrawerProps {
  visual: HostBattleVisualConfig;
  open: boolean;
  title: string;
  form: FormInstance<HostBattleFormValues>;
  showAdvanced: boolean;
  onToggleAdvanced: (checked: boolean) => void;
  onSubmit: (values: HostBattleFormValues) => void;
  onClose: () => void;
  onReset: () => void;
  submitButtonLoading: boolean;
}

export const BattleDrawer: FC<BattleDrawerProps> = ({
  visual,
  open,
  title,
  form,
  showAdvanced,
  onToggleAdvanced,
  onSubmit,
  onClose,
  onReset,
  submitButtonLoading,
}) => (
  <Drawer title={title} open={open} onClose={onClose} width={640} destroyOnClose={false} bodyStyle={{ padding: 0 }}>
    <ConfigProvider theme={visual.styles.formTheme}>
      <div className="host-battle-panel" style={{ ...visual.styles.formPanelStyle, border: "none", boxShadow: "none" }}>
        <style>{visual.styles.formEnhancementStyles}</style>
        <HostBattleForm
          form={form}
          showAdvanced={showAdvanced}
          onToggleAdvanced={onToggleAdvanced}
          onSubmit={onSubmit}
          submitButtonLabel="Save changes"
          submitButtonLoading={submitButtonLoading}
          onReset={onReset}
        />
      </div>
    </ConfigProvider>
  </Drawer>
);
