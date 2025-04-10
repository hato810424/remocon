import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve("../../.env") });

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
  },
  server: {
    port: Number(process.env.FRONTEND_PORT) || 3000,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true,
      },
      "/socket.io": {
        target: `ws://localhost:${process.env.BACKEND_PORT || 3001}/socket.io`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
