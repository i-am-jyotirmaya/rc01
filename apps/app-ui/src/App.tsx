import { useState, type FC, type JSX } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { ConfigProvider } from "antd";
import "@/App.css";
import { lightThemeConfig } from "@/themes/light-theme";

const App: FC = (): JSX.Element => {
  const [count, setCount] = useState(0);

  return (
    <>
      <ConfigProvider theme={lightThemeConfig}></ConfigProvider>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
};

export default App;
