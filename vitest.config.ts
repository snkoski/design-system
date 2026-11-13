import { resolve } from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

const configDir = resolve(import.meta.dirname, ".storybook");

// Two projects, run together by `pnpm test`:
//  unit       Testing Library tests (src/**/*.test.tsx) in jsdom: props, ARIA, keyboard, callbacks
//  storybook  every story in real Chromium, including play functions and the axe checks
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: "v8",
        include: ["src/components/**/*.tsx"],
        exclude: ["**/*.stories.tsx", "**/*.test.tsx", "**/index.ts"],
        reporter: ["text", "html"],
      },
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            environment: "jsdom",
            include: ["src/**/*.test.{ts,tsx}"],
            setupFiles: ["./tests/setup.ts"],
            restoreMocks: true,
            // A zone far from UTC, so code that reads "2026-11-12" as UTC midnight shows the 11th and a test fails.
            // src/internal/time-zone.test.ts proves it took effect.
            env: { TZ: "America/Anchorage" },
          },
        },
        {
          extends: true,
          plugins: [storybookTest({ configDir })],
          // Pre-bundle every Base UI primitive, and the Tiptap packages the RichText experiment uses, up front.
          // Otherwise the first story to use a new one makes Vite re-optimize and reload mid-run, and every story
          // file fails once.
          optimizeDeps: {
            include: [
              "@base-ui/react/*",
              "@daypicker/react",
              "date-fns",
              "date-fns/locale",
              "@tiptap/react",
              "@tiptap/starter-kit",
              "@tiptap/markdown",
              "@tiptap/extensions",
              "@tiptap/extension-link",
              "@tiptap/extension-list",
              "@tiptap/extension-underline",
              "@tiptap/pm/model",
              "@tiptap/pm/state",
              "@tiptap/pm/view",
            ],
          },
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
