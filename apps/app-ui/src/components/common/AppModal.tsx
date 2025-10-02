import { Modal } from "antd";
import type { ModalProps } from "antd";
import type { FC } from "react";

export const AppModal: FC<ModalProps> = ({ styles, ...props }) => {
  const mergedStyles: ModalProps["styles"] = {
    ...styles,
    mask: {
      backdropFilter: "blur(4px)",
      ...(styles?.mask ?? {}),
    },
    body: {
      padding: 24,
      ...(styles?.body ?? {}),
    },
  };

  return <Modal centered {...props} styles={mergedStyles} />;
};
