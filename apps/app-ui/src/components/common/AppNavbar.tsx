import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Layout, Space, theme } from "antd";
import type { CSSProperties, FC } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { openLoginModal } from "../../features/auth/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { EnvironmentSwitcher } from "./EnvironmentSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const { Header } = Layout;

export const AppNavbar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
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

  const handleLoginClick = useCallback(() => {
    dispatch(openLoginModal());
  }, [dispatch]);

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
      <Space size="middle" align="center">
        <EnvironmentSwitcher />
        <Button type="default" onClick={handleLoginClick}>
          Log in
        </Button>
        <ThemeToggle />
      </Space>
    </Header>
  );
};
