import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Library build: one ES module, with React and Base UI left for the app to provide.
// Storybook reuses this config, which is why Tailwind is here (stories use it for layout).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Every import starts from one of these, never with ./ or ../ (`pnpm check` enforces it). Keep tsconfig.json's
    // `paths` in step.
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      "@docs": resolve(import.meta.dirname, "docs"),
      "@tokens": resolve(import.meta.dirname, "tokens"),
      "@tests": resolve(import.meta.dirname, "tests"),
    },
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\/react($|\/)/],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
