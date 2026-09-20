import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
