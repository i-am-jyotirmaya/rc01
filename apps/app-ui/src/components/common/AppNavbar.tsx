import { ArrowLeftOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Space, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import type { CSSProperties, FC } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout, openLoginModal } from "../../features/auth/authSlice";
import { selectAuthUser } from "../../features/auth/selectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { EnvironmentSwitcher } from "./EnvironmentSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const { Header } = Layout;

export const AppNavbar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const isAuthenticated = Boolean(user);
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

  const userButtonStyle = useMemo<CSSProperties>(
    () => ({
      paddingInline: 8,
      paddingBlock: 4,
      height: "auto",
    }),
    [],
  );

  const displayName = useMemo(
    () => user?.firstName ?? user?.username ?? "Account",
    [user],
  );

  const avatarLabel = useMemo(() => {
    if (!user) {
      return "?";
    }

    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim();
    if (initials) {
      return initials.toUpperCase();
    }

    return (user.username?.[0] ?? "?").toUpperCase();
  }, [user]);

  const handleLoginClick = useCallback(() => {
    dispatch(openLoginModal());
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === "logout") {
        handleLogout();
      }
    },
    [handleLogout],
  );

  const userMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "logout",
        label: "Sign out",
      },
    ],
    [],
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
      <Space size="middle" align="center">
        <EnvironmentSwitcher />
        {isAuthenticated ? (
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleMenuClick }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" style={userButtonStyle}>
              <Space size={8} align="center">
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: token.colorPrimary,
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  {avatarLabel}
                </Avatar>
                <Typography.Text strong style={{ color: token.colorText }}>
                  {displayName}
                </Typography.Text>
              </Space>
            </Button>
          </Dropdown>
        ) : (
          <Button type="default" onClick={handleLoginClick}>
            Log in
          </Button>
        )}
        <ThemeToggle />
      </Space>
    </Header>
  );
};

