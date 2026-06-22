import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Load environment variables
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd());

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  base: "/",
});
