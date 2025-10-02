import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Button,
  ConfigProvider,
  Divider,
  Form,
  Layout,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import type { CSSProperties, FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HostBattleForm } from "../components/GetStarted/HostBattleForm";
import type { HostBattleFormValues } from "../components/GetStarted/HostBattleForm";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export const HostBattlePage: FC = () => {
  const [form] = Form.useForm<HostBattleFormValues>();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const accentColor = token.colorWarning;

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
      background: [
        "radial-gradient(900px circle at 10% 20%, rgba(250, 219, 20, 0.16), transparent 60%)",
        "radial-gradient(720px circle at 85% 15%, rgba(83, 86, 255, 0.18), transparent 65%)",
        "linear-gradient(160deg, rgba(8, 13, 34, 0.95), rgba(5, 8, 20, 0.98))",
      ].join(","),
      pointerEvents: "none",
    }),
    [],
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
      background: "rgba(12, 18, 40, 0.78)",
      border: `1px solid ${accentColor}29`,
      boxShadow: "0 30px 70px rgba(4, 8, 20, 0.4)",
      backdropFilter: "blur(18px)",
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 36px)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    }),
    [accentColor, token.marginMD],
  );

  const highlightListStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      paddingLeft: "1.2rem",
      color: "rgba(240, 245, 255, 0.82)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginSM,
      listStyle: "disc",
    }),
    [token.marginSM],
  );

  const formPanelStyle = useMemo<CSSProperties>(
    () => ({
      background: "rgba(6, 12, 32, 0.92)",
      border: `1px solid ${accentColor}33`,
      boxShadow: "0 30px 80px rgba(3, 6, 18, 0.55)",
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 40px)",
    }),
    [accentColor],
  );

  const tagStyle = useMemo<CSSProperties>(
    () => ({
      border: `1px solid ${accentColor}66`,
      background: `${accentColor}22`,
      color: "rgba(240, 245, 255, 0.9)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    }),
    [accentColor],
  );
  const formTheme = useMemo(
    () => ({
      token: {
        colorText: token.colorTextLightSolid,
        colorBgElevated: "rgba(10, 16, 36, 0.95)",
        colorBgContainer: "rgba(15, 22, 46, 0.65)",
        colorBorder: `${accentColor}33`,
        controlOutline: `${accentColor}AA`,
      },
      components: {
        Select: {
          colorBgContainer: "rgba(15, 22, 46, 0.65)",
          colorBgElevated: "rgba(10, 16, 36, 0.95)",
          optionSelectedBg: accentColor,
          optionSelectedColor: "#050814",
          optionActiveBg: `${accentColor}26`,
          controlItemBgActive: `${accentColor}26`,
          colorText: token.colorTextLightSolid,
        },
        Input: {
          colorBgContainer: "rgba(15, 22, 46, 0.65)",
        },
        InputNumber: {
          colorBgContainer: "rgba(15, 22, 46, 0.65)",
        },
        Radio: {
          buttonSolidCheckedBg: accentColor,
          buttonSolidCheckedActiveBg: accentColor,
          buttonSolidCheckedHoverBg: accentColor,
          buttonBg: "rgba(15, 22, 46, 0.6)",
          colorText: token.colorTextLightSolid,
        },
        Switch: {
          colorPrimary: accentColor,
        },
        Checkbox: {
          colorPrimary: accentColor,
        },
        Form: {
          labelColor: "rgba(240, 245, 255, 0.92)",
        },
      },
    }),
    [accentColor, token.colorTextLightSolid],
  );

  const formEnhancementStyles = useMemo(
    () => `
      .host-battle-panel .ant-form-item-label > label {
        color: rgba(240, 245, 255, 0.92) !important;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .host-battle-panel .ant-form-item-label > label .ant-form-item-optional,
      .host-battle-panel .ant-form-item-optional {
        color: rgba(240, 245, 255, 0.6) !important;
      }
      .host-battle-panel .ant-input,
      .host-battle-panel .ant-input-affix-wrapper,
      .host-battle-panel .ant-select-selector,
      .host-battle-panel .ant-select-selection-item,
      .host-battle-panel .ant-select-selection-placeholder,
      .host-battle-panel .ant-input-number,
      .host-battle-panel .ant-input-number-input {
        background: rgba(15, 22, 46, 0.65) !important;
        border-color: ${accentColor}33 !important;
        color: rgba(240, 245, 255, 0.95) !important;
      }
      .host-battle-panel .ant-input:hover,
      .host-battle-panel .ant-input-affix-wrapper:hover,
      .host-battle-panel .ant-select-selector:hover,
      .host-battle-panel .ant-input-number:hover {
        border-color: ${accentColor}AA !important;
      }
      .host-battle-panel .ant-input::placeholder,
      .host-battle-panel .ant-input-number-input::placeholder {
        color: rgba(240, 245, 255, 0.45) !important;
      }
      .host-battle-panel .ant-select-selection-placeholder {
        color: rgba(240, 245, 255, 0.5) !important;
      }
      .host-battle-panel .ant-select-arrow,
      .host-battle-panel .ant-picker-suffix {
        color: rgba(240, 245, 255, 0.75) !important;
      }
      .host-battle-panel .ant-radio-button-wrapper {
        background: rgba(15, 22, 46, 0.6) !important;
        color: rgba(240, 245, 255, 0.85) !important;
        border-color: ${accentColor}33 !important;
      }
      .host-battle-panel .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked):hover {
        border-color: ${accentColor}AA !important;
        color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-button-wrapper-checked {
        background: ${accentColor} !important;
        color: #050814 !important;
        border-color: ${accentColor} !important;
        box-shadow: 0 12px 32px rgba(250, 219, 20, 0.32);
      }
      .host-battle-panel .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
        background-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-inner,
      .host-battle-panel .ant-checkbox-inner {
        border-color: ${accentColor}88 !important;
      }
      .host-battle-panel .ant-radio-checked .ant-radio-inner {
        border-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-radio-checked .ant-radio-inner::after {
        background-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-checkbox-wrapper,
      .host-battle-panel .ant-checkbox + span {
        color: rgba(240, 245, 255, 0.85) !important;
      }
      .host-battle-panel .ant-checkbox-checked .ant-checkbox-inner {
        background-color: ${accentColor} !important;
        border-color: ${accentColor} !important;
      }
      .host-battle-panel .ant-switch {
        background: ${accentColor}33 !important;
      }
      .host-battle-panel .ant-switch.ant-switch-checked {
        background: ${accentColor} !important;
      }
      .host-battle-panel .ant-form-item-required::before {
        color: ${accentColor} !important;
      }
      .host-battle-panel .ant-btn-primary {
        box-shadow: 0 18px 40px rgba(250, 219, 20, 0.25);
      }
      .host-battle-select-dropdown {
        background: rgba(8, 13, 34, 0.96) !important;
        border: 1px solid ${accentColor}33 !important;
        box-shadow: 0 24px 80px rgba(3, 6, 18, 0.6) !important;
      }
      .host-battle-select-dropdown .ant-select-item {
        color: rgba(240, 245, 255, 0.88) !important;
      }
      .host-battle-select-dropdown .ant-select-item-option-active {
        background: ${accentColor}26 !important;
        color: rgba(240, 245, 255, 0.95) !important;
      }
      .host-battle-select-dropdown .ant-select-item-option-selected {
        background: ${accentColor} !important;
        color: #050814 !important;
      }
    `,
    [accentColor],
  );

  const handleSubmit = useCallback(
    async (values: HostBattleFormValues) => {
      message.success(`Battle "${values.battleName}" configured`);
      form.resetFields();
      setShowAdvancedOptions(false);
      navigate("/");
    },
    [form, navigate],
  );

  return (
    <Content style={contentStyle}>
      <div style={backgroundLayerStyle} />
      <div style={innerContainerStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ alignSelf: "flex-start", padding: 0, color: accentColor, fontWeight: 600 }}
        >
          Back
        </Button>
        <div style={headerStyle}>
          <Title level={2} style={{ margin: 0, color: token.colorWhite }}>
            Host your own battle
          </Title>
          <Paragraph style={{ margin: 0, color: "rgba(240, 245, 255, 0.85)" }}>
            Configure the rules, invite your competitors, and tailor the experience before you go live.
            Everything updates instantly so you can share the lobby the moment it feels ready.
          </Paragraph>
          <Text style={{ color: "rgba(240, 245, 255, 0.65)" }}>
            Prefer to join an existing competition? <Link to="/" style={{ color: accentColor }}>Return to the lobby</Link>
            to paste an invite link or code.
          </Text>
        </div>
        <div style={gridStyle}>
          <div style={summaryCardStyle}>
            <Title level={4} style={{ margin: 0, color: token.colorWhite }}>
              Battle blueprint
            </Title>
            <Paragraph style={{ margin: 0, color: "rgba(240, 245, 255, 0.78)" }}>
              Outline your format, scheduling, and moderation in one pass. You can revisit this setup any time before the
              battle starts.
            </Paragraph>
            <Space size={[token.marginSM, token.marginSM]} wrap>
              <Tag style={tagStyle}>Real-time control</Tag>
              <Tag style={tagStyle}>Private or public</Tag>
              <Tag style={tagStyle}>Power-up pools</Tag>
            </Space>
            <Divider style={{ margin: `${token.marginMD}px 0`, borderColor: `${accentColor}33` }} />
            <Paragraph strong style={{ margin: 0, color: token.colorWhite }}>Setup checklist</Paragraph>
            <ul style={highlightListStyle}>
              <li>Pick battle modes, difficulty, and player limits that match your format.</li>
              <li>Lock down privacy, queue sizing, and moderation so teams join smoothly.</li>
              <li>Enable advanced scoring, power-ups, and resources when you want extra spectacle.</li>
            </ul>
            <Paragraph style={{ margin: 0, color: "rgba(240, 245, 255, 0.68)" }}>
              Need inspiration? <Text style={{ color: accentColor }}>Community templates</Text> are dropping soon.
            </Paragraph>
          </div>
          <ConfigProvider
            theme={formTheme}
          >
            <div className="host-battle-panel" style={formPanelStyle}>
              <style>{formEnhancementStyles}</style>
              <HostBattleForm
                form={form}
                showAdvanced={showAdvancedOptions}
                onToggleAdvanced={setShowAdvancedOptions}
                onSubmit={handleSubmit}
              />
            </div>
          </ConfigProvider>
        </div>
      </div>
    </Content>
  );
};






