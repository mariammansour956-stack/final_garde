import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/v1/auth": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/auth/, "/api/v1/auth"),
      },
      "/api/v1/users": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/users/, "/api/v1/users"),
      },
      "/api/v1/orders": {
        target: "http://localhost:8002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/orders/, "/api/v1/orders"),
      },
      "/api/v1/notifications": {
        target: "http://localhost:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/notifications/, "/api/v1/notifications"),
      },
    },
  },
});
