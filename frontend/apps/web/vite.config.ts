import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function readHttpsConfig() {
  if (process.env.VITE_DEV_HTTPS !== "true") {
    return undefined;
  }

  const certPath = process.env.VITE_DEV_HTTPS_CERT;
  const keyPath = process.env.VITE_DEV_HTTPS_KEY;
  if (!certPath || !keyPath) {
    throw new Error("VITE_DEV_HTTPS is true but certificate path env vars are missing.");
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}

function readProxyConfig() {
  if (process.env.VITE_API_PROXY !== "true") {
    return undefined;
  }

  const target = process.env.VITE_API_URL;
  if (!target) {
    throw new Error("VITE_API_PROXY is true but VITE_API_URL is missing.");
  }

  return {
    "/api": {
      target,
      changeOrigin: true,
      secure: false,
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    https: readHttpsConfig(),
    proxy: readProxyConfig(),
  },
});
