import { Checkbox } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import type { FC } from "react";

interface AdvancedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const AdvancedToggle: FC<AdvancedToggleProps> = ({ checked, onChange }) => {
  const handleChange = (event: CheckboxChangeEvent) => {
    onChange(event.target.checked);
  };

  return <Checkbox checked={checked} onChange={handleChange}>Show advanced options</Checkbox>;
};
