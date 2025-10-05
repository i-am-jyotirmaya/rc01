import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const resolvePath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolvePath("./src"),
      "@rc01/api-client": resolvePath("../../packages/api-client/src"),
      "@rc01/problem-template": resolvePath(
        "../../packages/problem-template/src",
      ),
    },
  },
});
