import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".csb.app", ".stackblitz.io"], // allow Codesandbox + StackBlitz
    host: true, // bind to all interfaces
  },
});
