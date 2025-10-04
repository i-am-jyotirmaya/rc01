import { Layout, theme } from "antd";
import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthModal } from "./components/auth/AuthModal";
import { AppNavbar } from "./components/common/AppNavbar";
import { HeroSection } from "./components/Hero/HeroSection";
import { useThemeMode } from "./providers/theme-mode-context";
import { HostBattlePage } from "./pages/host-battle";

const App: FC = () => {
  const { token } = theme.useToken();
  const { mode } = useThemeMode();

  const layoutStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: "100vh",
      background:
        mode === "dark"
          ? [
              "radial-gradient(1200px circle at 5% 5%, rgba(250, 219, 20, 0.12), transparent 60%)",
              "radial-gradient(900px circle at 95% 15%, rgba(114, 109, 214, 0.25), transparent 55%)",
              "linear-gradient(180deg, rgba(5, 8, 20, 0.9), rgba(5, 8, 20, 0.98))",
            ].join(",")
          : [
              "radial-gradient(1200px circle at 5% 5%, rgba(250, 219, 20, 0.18), transparent 60%)",
              "radial-gradient(900px circle at 95% 15%, rgba(114, 109, 214, 0.18), transparent 55%)",
              "linear-gradient(180deg, rgba(247, 248, 255, 0.95), rgba(255, 255, 255, 0.98))",
            ].join(","),
      color: token.colorText,
      display: "flex",
      flexDirection: "column",
    }),
    [mode, token],
  );

  return (
    <Layout style={layoutStyle}>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/host" element={<HostBattlePage />} />
      </Routes>
      <AuthModal />
    </Layout>
  );
};

export default App;
