import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow tunnelling the dev server into the MiniPay webview for on-device testing.
    allowedHosts: [".ngrok.app", ".ngrok-free.dev", ".ngrok-free.app"],
  },
});
