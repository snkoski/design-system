# Troubleshooting

**`src/how-it-works/sources.test.ts` says a new file is missing from `sources`** ("expected [...] to include 'internal/New.tsx'"). The file is there: Vitest's module cache kept the old `import.meta.glob`. Delete `node_modules/.vitest-cache` and run again. Deleting `node_modules/.vite/vitest` doesn't help.

**`pnpm test` fails in a file this component didn't touch.** Rerun that file alone (`pnpm exec vitest run --project storybook <file>`) a few times. If it passes alone, report it to the user as possibly flaky, with the failing assertion. Don't loosen its test without their OK.

**A story's phase reads `completing`, not `finished`.** A story whose state keeps changing on its own (a simulated upload counting up) reports `completing` until it stops. Wait for it to settle before reading the phase; `completing` isn't a failure.

**A story passes in `pnpm test` but fails in the built Storybook.** Its `play` function starts before something an effect creates is there (a shadow root, a portal, a listener). Create it in `useLayoutEffect`, and `waitFor` it in `play` (`CLAUDE.md`, Testing).

**Files or packages changed under you.** Another session is sharing the folder and switched branches or reinstalled. Stop and suggest a worktree for one of the sessions (`CLAUDE.md`, Pull requests).
