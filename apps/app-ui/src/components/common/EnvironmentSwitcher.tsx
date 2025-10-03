import { Select, Space, Typography } from "antd";
import type { FC } from "react";
import { apiEnvironmentOptions } from "../../config/api-environments";
import { setApiEnvironment } from "../../features/environment/environmentSlice";
import { selectCurrentEnvironmentKey } from "../../features/environment/selectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const renderLabel = (label: string, baseUrl?: string) => (
  <Space direction="vertical" size={0} style={{ width: "100%" }}>
    <span>{label}</span>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {baseUrl ?? "Mock mode"}
    </Typography.Text>
  </Space>
);

export const EnvironmentSwitcher: FC = () => {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectCurrentEnvironmentKey);
  const disabled = apiEnvironmentOptions.length <= 1;

  return (
    <Select
      size="small"
      value={selected}
      onChange={(value) => dispatch(setApiEnvironment(value))}
      options={apiEnvironmentOptions.map((option) => ({
        value: option.key,
        label: renderLabel(option.label, option.baseUrl),
      }))}
      style={{ minWidth: 220 }}
      dropdownMatchSelectWidth={false}
      optionLabelProp="label"
      disabled={disabled}
      aria-label="Select backend environment"
    />
  );
};
