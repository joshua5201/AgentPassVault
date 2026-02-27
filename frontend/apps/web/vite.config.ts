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

export default defineConfig({
  plugins: [react()],
  server: {
    https: readHttpsConfig(),
  },
});
