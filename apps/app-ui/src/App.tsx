import { Layout, theme } from "antd";
import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import { HeroSection } from "./components/Hero/HeroSection";

const App: FC = () => {
  const { token } = theme.useToken();

  const layoutStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: "100vh",
      background: [
        "radial-gradient(1200px circle at 5% 5%, rgba(250, 219, 20, 0.12), transparent 60%)",
        "radial-gradient(900px circle at 95% 15%, rgba(114, 109, 214, 0.25), transparent 55%)",
        "linear-gradient(180deg, rgba(5, 8, 20, 0.9), rgba(5, 8, 20, 0.98))",
      ].join(","),
      color: token.colorTextLightSolid,
    }),
    [token],
  );

  return (
    <Layout style={layoutStyle}>
      <HeroSection />
    </Layout>
  );
};

export default App;
