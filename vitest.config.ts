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
          },
        },
        {
          extends: true,
          plugins: [storybookTest({ configDir })],
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
