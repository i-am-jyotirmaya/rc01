import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Layout, theme } from "antd";
import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const { Header } = Layout;

export const AppNavbar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const showBackButton = location.pathname !== "/";

  const headerStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingInline: "clamp(32px, 8vw, 96px)",
      paddingBlock: 24,
      background: "transparent",
      borderBottom: "none",
      height: "auto",
      lineHeight: "normal",
    }),
    [],
  );

  const backButtonStyle = useMemo<CSSProperties>(
    () => ({
      padding: 0,
      color: token.colorWarning,
      fontWeight: 600,
    }),
    [token.colorWarning],
  );

  return (
    <Header style={headerStyle}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        {showBackButton ? (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={backButtonStyle}
          >
            Back
          </Button>
        ) : null}
      </div>
      <ThemeToggle />
    </Header>
  );
};
