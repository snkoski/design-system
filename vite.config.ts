import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Library build: ES modules, with React, Base UI, DayPicker, and date-fns left for the app to provide.
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
      // The components, and the date-fns locales DatePicker takes (design-system/date-locales)
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        "date-locales": resolve(import.meta.dirname, "src/date-locales.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rolldownOptions: {
      // Installed by the app's package manager as the package's dependencies, so never bundled in a second copy
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@base-ui\/react($|\/)/,
        /^@daypicker\/react($|\/)/,
        /^date-fns($|\/)/,
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
