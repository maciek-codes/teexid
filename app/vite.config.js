import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
    },
    plugins: [react(), tsconfigPaths()],
    server: {
      host: "127.0.0.1",
      port: 3000,
    },
  };
});
