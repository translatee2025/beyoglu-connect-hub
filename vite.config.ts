import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Served from a sub-path on GitHub Pages in production; root in dev.
  base: mode === "production" ? "/beyoglu-connect-hub/" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep heavy/independent libs in their own cacheable chunks so the
        // initial app shell stays small and pages that don't use a lib
        // (e.g. maps) never pay for it.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          leaflet: ["leaflet", "react-leaflet"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
