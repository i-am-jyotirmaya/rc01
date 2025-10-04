import { Layout, message, Form } from "antd";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import type { BattleRecord } from "@rc/api-client";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  closeDrawer,
  createBattle,
  fetchBattles,
  openDrawer,
  setDrawerAdvancedOptions,
  setShowAdvancedOptions,
  startBattle,
  updateBattle,
} from "../../features/hostBattle/hostBattleSlice";
import {
  selectBattles,
  selectCreatePending,
  selectDrawerAdvancedOptions,
  selectDrawerOpen,
  selectHostBattleLoading,
  selectSelectedBattle,
  selectShowAdvancedOptions,
  selectStartingBattleId,
  selectUpdatePending,
} from "../../features/hostBattle/selectors";
import {
  extractFormValuesFromBattle,
  isConfigurableStatus,
  shouldDisplayAdvanced,
} from "../../features/hostBattle/utils";
import type { HostBattleFormValues } from "../../features/hostBattle/types";
import { useHostBattleVisualConfig } from "./hooks/useHostBattleVisualConfig";
import { BattleHero } from "./components/BattleHero";
import { BattleSummaryCard } from "./components/BattleSummaryCard";
import { BattleFormPanel } from "./components/BattleFormPanel";
import { BattleListPanel } from "./components/BattleListPanel";
import { BattleDrawer } from "./components/BattleDrawer";

const { Content } = Layout;

export const HostBattlePage: FC = () => {
  const dispatch = useAppDispatch();
  const battles = useAppSelector(selectBattles);
  const loadingBattles = useAppSelector(selectHostBattleLoading);
  const showAdvanced = useAppSelector(selectShowAdvancedOptions);
  const drawerAdvanced = useAppSelector(selectDrawerAdvancedOptions);
  const isDrawerOpen = useAppSelector(selectDrawerOpen);
  const selectedBattle = useAppSelector(selectSelectedBattle);
  const isCreating = useAppSelector(selectCreatePending);
  const isUpdating = useAppSelector(selectUpdatePending);
  const startingBattleId = useAppSelector(selectStartingBattleId);
  const [form] = Form.useForm<HostBattleFormValues>();
  const [drawerForm] = Form.useForm<HostBattleFormValues>();
  const visual = useHostBattleVisualConfig();

  useEffect(() => {
    void dispatch(fetchBattles())
      .unwrap()
      .catch((error) => {
        const messageText = typeof error === "string" ? error : "Unable to load battles.";
        message.error(messageText);
      });
  }, [dispatch]);

  useEffect(() => {
    if (!selectedBattle) {
      drawerForm.resetFields();
      return;
    }

    const values = extractFormValuesFromBattle(selectedBattle);
    drawerForm.setFieldsValue(values as Partial<HostBattleFormValues>);
    dispatch(setDrawerAdvancedOptions(shouldDisplayAdvanced(values)));
  }, [dispatch, drawerForm, selectedBattle]);

  const handleToggleAdvanced = useCallback(
    (checked: boolean) => {
      dispatch(setShowAdvancedOptions(checked));
    },
    [dispatch],
  );

  const handleDrawerToggleAdvanced = useCallback(
    (checked: boolean) => {
      dispatch(setDrawerAdvancedOptions(checked));
    },
    [dispatch],
  );

  const handleCreateBattle = useCallback(
    async (values: HostBattleFormValues) => {
      try {
        const battle = await dispatch(createBattle(values)).unwrap();
        message.success(`Battle "${battle.name}" saved`);
        form.resetFields();
        dispatch(setShowAdvancedOptions(false));
      } catch (error) {
        const messageText = typeof error === "string" ? error : "Failed to create battle.";
        message.error(messageText);
      }
    },
    [dispatch, form],
  );

  const handleDrawerSubmit = useCallback(
    async (values: HostBattleFormValues) => {
      if (!selectedBattle) {
        return;
      }

      try {
        const battle = await dispatch(updateBattle({ battleId: selectedBattle.id, values })).unwrap();
        message.success(`Battle "${battle.name}" updated`);

        if (!isConfigurableStatus(battle.status)) {
          dispatch(closeDrawer());
          return;
        }

        const nextValues = extractFormValuesFromBattle(battle);
        drawerForm.setFieldsValue(nextValues as Partial<HostBattleFormValues>);
        dispatch(setDrawerAdvancedOptions(shouldDisplayAdvanced(nextValues)));
      } catch (error) {
        const messageText = typeof error === "string" ? error : "Failed to update battle.";
        message.error(messageText);
      }
    },
    [dispatch, drawerForm, selectedBattle],
  );

  const handleDrawerClose = useCallback(() => {
    dispatch(closeDrawer());
    drawerForm.resetFields();
  }, [dispatch, drawerForm]);

  const handleDrawerReset = useCallback(() => {
    if (!selectedBattle) {
      drawerForm.resetFields();
      dispatch(setDrawerAdvancedOptions(false));
      return;
    }

    const values = extractFormValuesFromBattle(selectedBattle);
    drawerForm.setFieldsValue(values as Partial<HostBattleFormValues>);
    dispatch(setDrawerAdvancedOptions(shouldDisplayAdvanced(values)));
  }, [dispatch, drawerForm, selectedBattle]);

  const handleConfigureBattle = useCallback(
    (battle: BattleRecord) => {
      dispatch(openDrawer(battle.id));
    },
    [dispatch],
  );

  const handleStartBattle = useCallback(
    async (battle: BattleRecord) => {
      try {
        const updatedBattle = await dispatch(startBattle(battle.id)).unwrap();
        message.success(`Battle "${updatedBattle.name}" launched`);
      } catch (error) {
        const messageText = typeof error === "string" ? error : "Failed to start battle.";
        message.error(messageText);
      }
    },
    [dispatch],
  );

  return (
    <Content style={visual.styles.contentStyle}>
      <div style={visual.styles.backgroundLayerStyle} />
      <div style={visual.styles.innerContainerStyle}>
        <BattleHero visual={visual} />
        <div style={visual.styles.gridStyle}>
          <BattleSummaryCard visual={visual} />
          <BattleFormPanel
            visual={visual}
            form={form}
            showAdvanced={showAdvanced}
            onToggleAdvanced={handleToggleAdvanced}
            onSubmit={handleCreateBattle}
            submitButtonLoading={isCreating}
          />
        </div>
        <BattleListPanel
          visual={visual}
          battles={battles}
          loading={loadingBattles}
          startingBattleId={startingBattleId}
          onConfigure={handleConfigureBattle}
          onStartBattle={handleStartBattle}
        />
      </div>
      <BattleDrawer
        visual={visual}
        open={isDrawerOpen}
        title={selectedBattle ? `Configure "${selectedBattle.name}"` : "Configure battle"}
        form={drawerForm}
        showAdvanced={drawerAdvanced}
        onToggleAdvanced={handleDrawerToggleAdvanced}
        onSubmit={handleDrawerSubmit}
        onClose={handleDrawerClose}
        onReset={handleDrawerReset}
        submitButtonLoading={isUpdating}
      />
    </Content>
  );
};
