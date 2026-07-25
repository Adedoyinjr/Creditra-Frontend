// ALTERNATE Vite config for local sandbox demos only.
//
// The repo ships two configs (vite.config.js + vite.config.ts) that both
// load `@tailwindcss/vite`, which transitively requires the platform-
// specific `@tailwindcss/oxide` native binding. On systems where that
// binary fails to install (the upstream tailwind issue #4828), vite
// refuses to start with "Cannot find native binding".
//
// This file is functionally identical to vite.config.js EXCEPT it omits
// the tailwindcss plugin, so the React app still mounts and serves — the
// utility classes won't be processed (visually unstyled), but every
// other component including the new EmptyState renders correctly because
// it is hand-CSS only.
//
// Use:  `pnpm exec vite --config vite.config.local.js`
//
// This file is intentionally tracked in the branch so the demo can run
// even when the native binding is unavailable; it can be removed once
// the upstream Tailwind install issue is resolved in CI.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// NOTE: @tailwindcss/vite deliberately omitted in this config.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173, host: "127.0.0.1" },
});
