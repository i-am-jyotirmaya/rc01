import { Button, ConfigProvider, Divider, Empty, Form, Layout, Space, Table, Tag, Typography, message, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { CSSProperties, FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BattleRecord,
  BattleStatus,
  CreateBattleRequestPayload,
  UpdateBattleRequestPayload,
} from "@rc/api-client";
import { Link, useNavigate } from "react-router-dom";
import { HostBattleForm } from "../components/GetStarted/HostBattleForm";
import type { HostBattleFormValues, StartMode } from "../components/GetStarted/HostBattleForm";
import { battleApi } from "../services/api";
import { useThemeMode } from "../providers/theme-mode-context";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const configurableStatuses: BattleStatus[] = ["draft", "configuring", "ready", "scheduled"];

const statusMeta: Record<BattleStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "default" },
  configuring: { label: "Configuring", color: "gold" },
  ready: { label: "Ready", color: "green" },
  scheduled: { label: "Scheduled", color: "blue" },
  lobby: { label: "Lobby", color: "cyan" },
  active: { label: "Active", color: "purple" },
  completed: { label: "Completed", color: "default" },
  cancelled: { label: "Cancelled", color: "red" },
};

const formatDateTime = (value?: string | null) =>
  value ? dayjs(value).format("MMM D, YYYY h:mm A") : "—";

const createErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const extractBattles = (response: unknown): BattleRecord[] => {
  const candidate = (response as { battles?: unknown }).battles;
  return Array.isArray(candidate) ? (candidate as BattleRecord[]) : [];
};

const extractBattle = (response: unknown): BattleRecord | undefined => {
  const candidate = (response as { battle?: unknown }).battle;
  if (candidate && typeof candidate === "object") {
    return candidate as BattleRecord;
  }
  return undefined;
};

const buildBattlePayload = (
  values: HostBattleFormValues,
): {
  create: CreateBattleRequestPayload;
  update: UpdateBattleRequestPayload;
  configuration: Record<string, unknown>;
} => {
  const startMode = (values.startMode ?? "manual") as StartMode;
  const sanitizedName = values.battleName.trim();
  const shortDescription = values.shortDescription?.trim() ?? "";
  const scheduledStartAt =
    startMode === "scheduled"
      ? values.scheduledStartAt
        ? values.scheduledStartAt.toISOString()
        : null
      : null;

  const configurationInput = {
    ...values,
    battleName: sanitizedName,
    shortDescription: shortDescription || undefined,
    startMode,
    scheduledStartAt,
  };

  const configuration = JSON.parse(JSON.stringify(configurationInput)) as Record<string, unknown>;

  if (!shortDescription) {
    delete configuration.shortDescription;
  }

  if (startMode !== "scheduled") {
    configuration.scheduledStartAt = null;
  }

  const createPayload: CreateBattleRequestPayload = {
    name: sanitizedName,
    shortDescription: shortDescription ? shortDescription : null,
    configuration,
    startMode,
    scheduledStartAt,
  };

  const updatePayload: UpdateBattleRequestPayload = {
    name: sanitizedName,
    shortDescription: shortDescription ? shortDescription : null,
    configuration,
    startMode,
    scheduledStartAt,
  };

  return { create: createPayload, update: updatePayload, configuration };
};

const isConfigurableStatus = (status: BattleStatus) => configurableStatuses.includes(status);

interface HostBattlePalette {
  backgroundGradients: string[];
  summaryBackground: string;
  summaryBorderColor: string;
  summaryShadow: string;
  highlightListColor: string;
  panelBackground: string;
  panelBorderColor: string;
  panelShadow: string;
  tagBorderColor: string;
  tagBackground: string;
  tagTextColor: string;
  controlTextColor: string;
  controlBackground: string;
  controlBorderColor: string;
  controlBorderHoverColor: string;
  controlOutlineColor: string;
  controlPlaceholderColor: string;
  controlArrowColor: string;
  checkboxTextColor: string;
  radioInactiveBackground: string;
  radioInactiveTextColor: string;
  radioShadow: string;
  switchBackground: string;
  switchCheckedBackground: string;
  primaryButtonShadow: string;
  dropdownBackground: string;
  dropdownBorderColor: string;
  dropdownShadow: string;
  dropdownTextColor: string;
  dropdownActiveBackground: string;
  dropdownActiveTextColor: string;
  dropdownSelectedBackground: string;
  dropdownSelectedTextColor: string;
  headingColor: string;
  bodyTextColor: string;
  paragraphMutedColor: string;
  linkHintColor: string;
  dividerColor: string;
  labelColor: string;
  optionalLabelColor: string;
}

export const HostBattlePage: FC = () => {
  const [form] = Form.useForm<HostBattleFormValues>();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [battles, setBattles] = useState<BattleRecord[]>([]);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [startingBattleId, setStartingBattleId] = useState<string | null>(null);
  const { token } = theme.useToken();
  const { mode } = useThemeMode();
  const navigate = useNavigate();
  const accentColor = token.colorWarning;
  const isDark = mode === "dark";

  const palette = useMemo<HostBattlePalette>(
    () =>
      isDark
        ? {
            backgroundGradients: [
              "radial-gradient(900px circle at 10% 20%, rgba(250, 219, 20, 0.16), transparent 60%)",
              "radial-gradient(720px circle at 85% 15%, rgba(83, 86, 255, 0.18), transparent 65%)",
              "linear-gradient(160deg, rgba(8, 13, 34, 0.95), rgba(5, 8, 20, 0.98))",
            ],
            summaryBackground: "rgba(12, 18, 40, 0.78)",
            summaryBorderColor: `${accentColor}29`,
            summaryShadow: "0 30px 70px rgba(4, 8, 20, 0.4)",
            highlightListColor: "rgba(240, 245, 255, 0.82)",
            panelBackground: "rgba(6, 12, 32, 0.92)",
            panelBorderColor: `${accentColor}33`,
            panelShadow: "0 30px 80px rgba(3, 6, 18, 0.55)",
            tagBorderColor: `${accentColor}66`,
            tagBackground: `${accentColor}22`,
            tagTextColor: "rgba(240, 245, 255, 0.9)",
            controlTextColor: "rgba(240, 245, 255, 0.95)",
            controlBackground: "rgba(15, 22, 46, 0.65)",
            controlBorderColor: `${accentColor}33`,
            controlBorderHoverColor: `${accentColor}AA`,
            controlOutlineColor: `${accentColor}AA`,
            controlPlaceholderColor: "rgba(240, 245, 255, 0.45)",
            controlArrowColor: "rgba(240, 245, 255, 0.75)",
            checkboxTextColor: "rgba(240, 245, 255, 0.85)",
            radioInactiveBackground: "rgba(15, 22, 46, 0.6)",
            radioInactiveTextColor: "rgba(240, 245, 255, 0.85)",
            radioShadow: "0 12px 32px rgba(250, 219, 20, 0.32)",
            switchBackground: `${accentColor}33`,
            switchCheckedBackground: accentColor,
            primaryButtonShadow: "0 18px 40px rgba(250, 219, 20, 0.25)",
            dropdownBackground: "rgba(8, 13, 34, 0.96)",
            dropdownBorderColor: `${accentColor}33`,
            dropdownShadow: "0 24px 80px rgba(3, 6, 18, 0.6)",
            dropdownTextColor: "rgba(240, 245, 255, 0.88)",
            dropdownActiveBackground: `${accentColor}26`,
            dropdownActiveTextColor: "rgba(240, 245, 255, 0.95)",
            dropdownSelectedBackground: accentColor,
            dropdownSelectedTextColor: "#050814",
            headingColor: token.colorWhite,
            bodyTextColor: "rgba(240, 245, 255, 0.78)",
            paragraphMutedColor: "rgba(240, 245, 255, 0.68)",
            linkHintColor: "rgba(240, 245, 255, 0.65)",
            dividerColor: `${accentColor}33`,
            labelColor: "rgba(240, 245, 255, 0.92)",
            optionalLabelColor: "rgba(240, 245, 255, 0.6)",
          }
        : {
            backgroundGradients: [
              "radial-gradient(900px circle at 12% 20%, rgba(250, 219, 20, 0.32), transparent 60%)",
              "radial-gradient(720px circle at 82% 18%, rgba(106, 114, 255, 0.2), transparent 65%)",
              "linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.98))",
            ],
            summaryBackground: "rgba(255, 255, 255, 0.92)",
            summaryBorderColor: "rgba(15, 23, 42, 0.08)",
            summaryShadow: "0 28px 56px rgba(15, 23, 42, 0.12)",
            highlightListColor: "rgba(36, 52, 93, 0.82)",
            panelBackground: "rgba(255, 255, 255, 0.96)",
            panelBorderColor: "rgba(15, 23, 42, 0.08)",
            panelShadow: "0 32px 60px rgba(15, 23, 42, 0.14)",
            tagBorderColor: "rgba(250, 219, 20, 0.3)",
            tagBackground: "rgba(250, 219, 20, 0.12)",
            tagTextColor: "rgba(23, 30, 54, 0.9)",
            controlTextColor: "rgba(23, 30, 54, 0.92)",
            controlBackground: "rgba(250, 252, 255, 0.95)",
            controlBorderColor: "rgba(15, 23, 42, 0.12)",
            controlBorderHoverColor: `${accentColor}80`,
            controlOutlineColor: `${accentColor}80`,
            controlPlaceholderColor: "rgba(71, 85, 134, 0.55)",
            controlArrowColor: "rgba(36, 52, 93, 0.55)",
            checkboxTextColor: "rgba(36, 52, 93, 0.82)",
            radioInactiveBackground: "rgba(245, 248, 255, 0.9)",
            radioInactiveTextColor: "rgba(36, 52, 93, 0.85)",
            radioShadow: "0 12px 30px rgba(250, 219, 20, 0.2)",
            switchBackground: `${accentColor}33`,
            switchCheckedBackground: accentColor,
            primaryButtonShadow: "0 18px 32px rgba(250, 219, 20, 0.2)",
            dropdownBackground: "rgba(255, 255, 255, 0.98)",
            dropdownBorderColor: "rgba(15, 23, 42, 0.08)",
            dropdownShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            dropdownTextColor: "rgba(36, 52, 93, 0.88)",
            dropdownActiveBackground: `${accentColor}26`,
            dropdownActiveTextColor: "rgba(36, 52, 93, 0.88)",
            dropdownSelectedBackground: accentColor,
            dropdownSelectedTextColor: "#050814",
            headingColor: token.colorTextHeading,
            bodyTextColor: "rgba(36, 52, 93, 0.85)",
            paragraphMutedColor: "rgba(57, 72, 112, 0.72)",
            linkHintColor: "rgba(60, 75, 120, 0.7)",
            dividerColor: "rgba(15, 23, 42, 0.08)",
            labelColor: "rgba(36, 52, 93, 0.9)",
            optionalLabelColor: "rgba(71, 85, 134, 0.6)",
          },
    [accentColor, isDark, token.colorTextHeading, token.colorWhite],
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      padding: "clamp(48px, 6vw, 96px) clamp(24px, 6vw, 64px)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
    }),
    [],
  );

  const backgroundLayerStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      background: palette.backgroundGradients.join(","),
      pointerEvents: "none",
    }),
    [palette],
  );

  const innerContainerStyle = useMemo<CSSProperties>(
    () => ({
      position: "relative",
      zIndex: 1,
      width: "min(1120px, 100%)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginXL,
    }),
    [token.marginXL],
  );

  const headerStyle = useMemo<CSSProperties>(
    () => ({
      maxWidth: "720px",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    }),
    [token.marginMD],
  );

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: token.marginXL,
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      alignItems: "flex-start",
      alignContent: "flex-start",
    }),
    [token.marginXL],
  );

  const summaryCardStyle = useMemo<CSSProperties>(
    () => ({
      background: palette.summaryBackground,
      border: `1px solid ${palette.summaryBorderColor}`,
      boxShadow: palette.summaryShadow,
      backdropFilter: "blur(18px)",
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 36px)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    }),
    [palette, token.marginMD],
  );

  const highlightListStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      paddingLeft: "1.2rem",
      color: palette.highlightListColor,
      display: "flex",
      flexDirection: "column",
      gap: token.marginSM,
      listStyle: "disc",
    }),
    [palette, token.marginSM],
  );

  const formPanelStyle = useMemo<CSSProperties>(
    () => ({
      background: palette.panelBackground,
      border: `1px solid ${palette.panelBorderColor}`,
      boxShadow: palette.panelShadow,
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 40px)",
    }),
    [palette],
  );

  const tablePanelStyle = useMemo<CSSProperties>(
    () => ({
      background: palette.panelBackground,
      border: `1px solid ${palette.panelBorderColor}`,
      boxShadow: palette.panelShadow,
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 40px)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    }),
    [palette, token.marginMD],
  );

  const tagStyle = useMemo<CSSProperties>(
    () => ({
      border: `1px solid ${palette.tagBorderColor}`,
      background: palette.tagBackground,
      color: palette.tagTextColor,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    }),
    [palette],
  );

  const formTheme = useMemo(
    () => ({
      token: {
        colorText: palette.controlTextColor,
        colorBgElevated: palette.panelBackground,
        colorBgContainer: palette.controlBackground,
        colorBorder: palette.controlBorderColor,
        controlOutline: palette.controlOutlineColor,
      },
      components: {
        Select: {
          colorBgContainer: palette.controlBackground,
          colorBgElevated: palette.panelBackground,
          optionSelectedBg: palette.dropdownSelectedBackground,
          optionSelectedColor: palette.dropdownSelectedTextColor,
          optionActiveBg: palette.dropdownActiveBackground,
          controlItemBgActive: palette.dropdownActiveBackground,
          colorText: palette.controlTextColor,
        },
        Input: {
          colorBgContainer: palette.controlBackground,
        },
        InputNumber: {
          colorBgContainer: palette.controlBackground,
        },
        Radio: {
          buttonSolidCheckedBg: accentColor,
          buttonSolidCheckedActiveBg: accentColor,
          buttonSolidCheckedHoverBg: accentColor,
          buttonBg: palette.radioInactiveBackground,
          colorText: palette.radioInactiveTextColor,
        },
        Switch: {
          colorPrimary: accentColor,
        },
        Checkbox: {
          colorPrimary: accentColor,
        },
        Form: {
          labelColor: palette.labelColor,
        },
      },
    }),
    [accentColor, palette],
  );

  const formEnhancementStyles = useMemo(
    () => `
      .host-battle-panel .ant-form-item-label > label {
        color: ${palette.labelColor} !important;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .host-battle-panel .ant-form-item-label > label .ant-form-item-optional,
      .host-battle-panel .ant-form-item-optional {
        color: ${palette.optionalLabelColor} !important;
      }
      .host-battle-panel .ant-input,
      .host-battle-panel .ant-input-affix-wrapper,
      .host-battle-panel .ant-select-selector,
      .host-battle-panel .ant-select-selection-item,
      .host-battle-panel .ant-select-selection-placeholder,
      .host-battle-panel .ant-input-number,
      .host-battle-panel .ant-input-number-input {
        background: ${palette.controlBackground} !important;
        border-color: ${palette.controlBorderColor} !important;
        color: ${palette.controlTextColor} !important;
      }
      .host-battle-panel .ant-input:hover,
      .host-battle-panel .ant-input-affix-wrapper:hover,
      .host-battle-panel .ant-select-selector:hover,
      .host-battle-panel .ant-input-number:hover {
        border-color: ${palette.controlBorderHoverColor} !important;
      }
      .host-battle-panel .ant-input::placeholder,
      .host-battle-panel .ant-input-number-input::placeholder {
        color: ${palette.controlPlaceholderColor} !important;
      }
      .host-battle-panel .ant-select-selection-placeholder {
        color: ${palette.controlPlaceholderColor} !important;
      }
      .host-battle-panel .ant-select-arrow,
      .host-battle-panel .ant-picker-suffix {
        color: ${palette.controlArrowColor} !important;
      }
      .host-battle-panel .ant-radio-button-wrapper {
        background: ${palette.radioInactiveBackground} !important;
        color: ${palette.radioInactiveTextColor} !important;
        border-color: ${palette.controlBorderColor} !important;
      }
      .host-battle-panel .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked):hover {
        border-color: ${palette.controlBorderHoverColor} !important;
        color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-button-wrapper-checked {
        background: ${accentColor} !important;
        color: #050814 !important;
        border-color: ${accentColor} !important;
        box-shadow: ${palette.radioShadow};
      }
      .host-battle-panel .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
        background-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-inner,
      .host-battle-panel .ant-checkbox-inner {
        border-color: ${palette.controlBorderColor} !important;
      }
      .host-battle-panel .ant-radio-checked .ant-radio-inner {
        border-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-checked .ant-radio-inner::after {
        background-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-checkbox-wrapper,
      .host-battle-panel .ant-checkbox + span {
        color: ${palette.checkboxTextColor} !important;
      }
      .host-battle-panel .ant-checkbox-checked .ant-checkbox-inner {
        background-color: ${accentColor} !important;
        border-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-switch {
        background: ${palette.switchBackground} !important;
      }
      .host-battle-panel .ant-switch.ant-switch-checked {
        background: ${palette.switchCheckedBackground} !important;
      }
      .host-battle-panel .ant-form-item-required::before {
        color: ${accentColor} !important;
      }
      .host-battle-panel .ant-btn-primary {
        box-shadow: ${palette.primaryButtonShadow};
      }
      .host-battle-select-dropdown {
        background: ${palette.dropdownBackground} !important;
        border: 1px solid ${palette.dropdownBorderColor} !important;
        box-shadow: ${palette.dropdownShadow} !important;
      }
      .host-battle-select-dropdown .ant-select-item {
        color: ${palette.dropdownTextColor} !important;
      }
      .host-battle-select-dropdown .ant-select-item-option-active {
        background: ${palette.dropdownActiveBackground} !important;
        color: ${palette.dropdownActiveTextColor} !important;
      }
      .host-battle-select-dropdown .ant-select-item-option-selected {
        background: ${palette.dropdownSelectedBackground} !important;
        color: ${palette.dropdownSelectedTextColor} !important;
      }
    `,
    [accentColor, palette],
  );

  const loadBattles = useCallback(async () => {
    setLoadingBattles(true);
    try {
      const response = await battleApi.listBattles();
      setBattles(extractBattles(response));
    } catch (error) {
      message.error(createErrorMessage(error, "Unable to load battles."));
    } finally {
      setLoadingBattles(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (values: HostBattleFormValues) => {
      setIsCreating(true);
      try {
        const { create } = buildBattlePayload(values);
        const response = await battleApi.createBattle(create);
        const createdBattle = extractBattle(response);
        message.success(`Battle "${createdBattle?.name ?? values.battleName.trim()}" saved`);
        form.resetFields();
        setShowAdvancedOptions(false);
        await loadBattles();
      } catch (error) {
        message.error(createErrorMessage(error, "Failed to create battle."));
      } finally {
        setIsCreating(false);
      }
    },
    [form, loadBattles],
  );

  const handleStartBattle = useCallback(
    async (battle: BattleRecord) => {
      setStartingBattleId(battle.id);
      try {
        const response = await battleApi.startBattle(battle.id);
        const updatedBattle = extractBattle(response) ?? battle;
        message.success(`Battle "${updatedBattle.name}" launched`);
        await loadBattles();
      } catch (error) {
        message.error(createErrorMessage(error, "Failed to start battle."));
      } finally {
        setStartingBattleId(null);
      }
    },
    [loadBattles],
  );

  const handleNavigateToConfig = useCallback(
    (battleId: string) => {
      navigate(`/admin/battles/${battleId}/config`);
    },
    [navigate],
  );

  useEffect(() => {
    void loadBattles();
  }, [loadBattles]);

  const columns = useMemo<ColumnsType<BattleRecord>>(
    () => [
      {
        title: "Battle",
        dataIndex: "name",
        key: "name",
        render: (_: unknown, record) => (
          <Space direction="vertical" size={4} align="start">
            <Typography.Text strong style={{ color: palette.headingColor }}>
              {record.name}
            </Typography.Text>
            {record.shortDescription ? (
              <Typography.Text style={{ color: palette.paragraphMutedColor }}>
                {record.shortDescription}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: BattleStatus) => {
          const meta = statusMeta[status];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Launch",
        key: "launch",
        render: (_: unknown, record) => (
          <Space direction="vertical" size={4} align="start">
            <Tag color={record.autoStart ? statusMeta.scheduled.color : "default"}>
              {record.autoStart ? "Scheduled" : "Manual"}
            </Tag>
            {record.autoStart && record.scheduledStartAt ? (
              <Typography.Text style={{ color: palette.paragraphMutedColor }}>
                {formatDateTime(record.scheduledStartAt)}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Last updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (value: string) => (
          <Typography.Text style={{ color: palette.paragraphMutedColor }}>
            {formatDateTime(value)}
          </Typography.Text>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "right" as const,
        render: (_: unknown, record) => {
          const canStart = record.status === "ready" || record.status === "scheduled";
          return (
            <Space size="small">
              <Button
                type="link"
                onClick={() => handleNavigateToConfig(record.id)}
                disabled={!isConfigurableStatus(record.status)}
              >
                Configure
              </Button>
              <Button
                type="link"
                onClick={() => handleStartBattle(record)}
                disabled={!canStart}
                loading={startingBattleId === record.id}
              >
                Start now
              </Button>
            </Space>
          );
        },
      },
    ],
    [handleNavigateToConfig, handleStartBattle, palette.headingColor, palette.paragraphMutedColor, startingBattleId],
  );

  return (
    <Content style={contentStyle}>
      <div style={backgroundLayerStyle} />
      <div style={innerContainerStyle}>
        <div style={headerStyle}>
          <Title level={2} style={{ margin: 0, color: palette.headingColor }}>
            Host your own battle
          </Title>
          <Paragraph style={{ margin: 0, color: palette.bodyTextColor }}>
            Configure the rules, invite your competitors, and tailor the experience before you go live. Everything updates
            instantly so you can share the lobby the moment it feels ready.
          </Paragraph>
          <Text style={{ color: palette.linkHintColor }}>
            Prefer to join an existing competition? <Link to="/" style={{ color: accentColor }}>Return to the lobby</Link>
            to paste an invite link or code.
          </Text>
        </div>
        <div style={gridStyle}>
          <div style={summaryCardStyle}>
            <Title level={4} style={{ margin: 0, color: palette.headingColor }}>
              Battle blueprint
            </Title>
            <Paragraph style={{ margin: 0, color: palette.bodyTextColor }}>
              Outline your format, scheduling, and moderation in one pass. You can revisit this setup any time before the
              battle starts.
            </Paragraph>
            <Space size={[token.marginSM, token.marginSM]} wrap>
              <Tag style={tagStyle}>Real-time control</Tag>
              <Tag style={tagStyle}>Private or public</Tag>
              <Tag style={tagStyle}>Power-up pools</Tag>
            </Space>
            <Divider style={{ margin: `${token.marginMD}px 0`, borderColor: palette.dividerColor }} />
            <Paragraph strong style={{ margin: 0, color: palette.headingColor }}>Setup checklist</Paragraph>
            <ul style={highlightListStyle}>
              <li>Pick battle modes, difficulty, and player limits that match your format.</li>
              <li>Lock down privacy, queue sizing, and moderation so teams join smoothly.</li>
              <li>Enable advanced scoring, power-ups, and resources when you want extra spectacle.</li>
            </ul>
            <Paragraph style={{ margin: 0, color: palette.paragraphMutedColor }}>
              Need inspiration? <Text style={{ color: accentColor }}>Community templates</Text> are dropping soon.
            </Paragraph>
          </div>
          <ConfigProvider theme={formTheme}>
            <div className="host-battle-panel" style={formPanelStyle}>
              <style>{formEnhancementStyles}</style>
              <HostBattleForm
                form={form}
                showAdvanced={showAdvancedOptions}
                onToggleAdvanced={setShowAdvancedOptions}
                onSubmit={handleSubmit}
                submitButtonLoading={isCreating}
              />
            </div>
          </ConfigProvider>
        </div>
        <ConfigProvider theme={formTheme}>
          <div style={tablePanelStyle}>
            <Title level={4} style={{ margin: 0, color: palette.headingColor }}>
              Battle control center
            </Title>
            <Paragraph style={{ margin: 0, color: palette.bodyTextColor }}>
              Monitor upcoming battles, tweak configurations, and launch when the timing is right. Scheduled battles will
              auto-launch, while manual battles stay parked here until you start them.
            </Paragraph>
            <Table
              columns={columns}
              dataSource={battles}
              rowKey="id"
              loading={loadingBattles}
              pagination={false}
              size="middle"
              locale={{ emptyText: <Empty description="No battles configured yet" /> }}
              style={{ background: "transparent" }}
            />
          </div>
        </ConfigProvider>
      </div>
    </Content>
  );
};
