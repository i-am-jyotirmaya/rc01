import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { ConfigProviderProps } from "antd";
import { theme } from "antd";
import { useThemeMode } from "../../../providers/theme-mode-context";

export interface HostBattlePalette {
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

export interface HostBattleVisualConfig {
  palette: HostBattlePalette;
  accentColor: string;
  styles: {
    contentStyle: CSSProperties;
    backgroundLayerStyle: CSSProperties;
    innerContainerStyle: CSSProperties;
    headerStyle: CSSProperties;
    gridStyle: CSSProperties;
    summaryCardStyle: CSSProperties;
    highlightListStyle: CSSProperties;
    formPanelStyle: CSSProperties;
    tablePanelStyle: CSSProperties;
    tagStyle: CSSProperties;
    formTheme: ConfigProviderProps["theme"];
    formEnhancementStyles: string;
  };
}

export const useHostBattleVisualConfig = (): HostBattleVisualConfig => {
  const { token } = theme.useToken();
  const { mode } = useThemeMode();
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

  const styles = useMemo(() => {
    const contentStyle: CSSProperties = {
      padding: "clamp(48px, 6vw, 96px) clamp(24px, 6vw, 64px)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
    };

    const backgroundLayerStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      background: palette.backgroundGradients.join(","),
      pointerEvents: "none",
    };

    const innerContainerStyle: CSSProperties = {
      position: "relative",
      zIndex: 1,
      width: "min(1120px, 100%)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginXL,
    };

    const headerStyle: CSSProperties = {
      maxWidth: "720px",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    };

    const gridStyle: CSSProperties = {
      display: "grid",
      gap: token.marginXL,
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      alignItems: "flex-start",
      alignContent: "flex-start",
    };

    const summaryCardStyle: CSSProperties = {
      background: palette.summaryBackground,
      border: `1px solid ${palette.summaryBorderColor}`,
      boxShadow: palette.summaryShadow,
      backdropFilter: "blur(18px)",
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 36px)",
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    };

    const highlightListStyle: CSSProperties = {
      margin: 0,
      paddingLeft: "1.2rem",
      color: palette.highlightListColor,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    };

    const formPanelStyle: CSSProperties = {
      background: palette.panelBackground,
      border: `1px solid ${palette.panelBorderColor}`,
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 32px)",
      boxShadow: palette.panelShadow,
      display: "flex",
      flexDirection: "column",
      gap: token.marginLG,
    };

    const tablePanelStyle: CSSProperties = {
      background: palette.panelBackground,
      border: `1px solid ${palette.panelBorderColor}`,
      borderRadius: 24,
      padding: "clamp(24px, 4vw, 32px)",
      boxShadow: palette.panelShadow,
      display: "flex",
      flexDirection: "column",
      gap: token.marginMD,
    };

    const tagStyle: CSSProperties = {
      borderColor: palette.tagBorderColor,
      background: palette.tagBackground,
      color: palette.tagTextColor,
      fontWeight: 600,
      letterSpacing: "0.01em",
    };

    const formTheme: ConfigProviderProps["theme"] = {
      token: {
        colorText: palette.controlTextColor,
        colorBgElevated: palette.panelBackground,
        colorBorder: palette.controlBorderColor,
        colorPrimary: accentColor,
        colorPrimaryHover: palette.controlBorderHoverColor,
        colorPrimaryActive: accentColor,
        controlOutline: palette.controlOutlineColor,
        colorBgContainer: palette.controlBackground,
      },
      components: {
        Input: {
          colorBgContainer: palette.controlBackground,
          colorBorder: palette.controlBorderColor,
          colorTextPlaceholder: palette.controlPlaceholderColor,
        },
        Select: {
          colorBgContainer: palette.controlBackground,
          colorBorder: palette.controlBorderColor,
          colorText: palette.controlTextColor,
        },
        InputNumber: {
          colorBgContainer: palette.controlBackground,
          colorBorder: palette.controlBorderColor,
          colorText: palette.controlTextColor,
        },
        DatePicker: {
          colorBgContainer: palette.controlBackground,
          colorBorder: palette.controlBorderColor,
          colorText: palette.controlTextColor,
        },
        Radio: {
          buttonColor: palette.radioInactiveBackground,
          buttonSolidCheckedColor: accentColor,
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
    };

    const formEnhancementStyles = `
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
    `;

    return {
      contentStyle,
      backgroundLayerStyle,
      innerContainerStyle,
      headerStyle,
      gridStyle,
      summaryCardStyle,
      highlightListStyle,
      formPanelStyle,
      tablePanelStyle,
      tagStyle,
      formTheme,
      formEnhancementStyles,
    };
  }, [accentColor, palette, token.marginLG, token.marginMD, token.marginXL]);

  return {
    palette,
    accentColor,
    styles,
  };
};
