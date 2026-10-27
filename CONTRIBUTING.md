# Contributing

Read `CLAUDE.md` first. It has the rules for tokens, CSS, accessibility, motion, and tests, and it applies to people as much as to AI tools. The brand book in `docs/brand/` explains the reasons.

## Workflow

1. Branch from `main`, for example `add-input` or `fix-button-focus`.
2. Make the change. Follow the "Adding a component" steps in `CLAUDE.md` for a new component.
3. Run `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm build-storybook`. All five must pass. Run `pnpm check:tests --base main` too, and explain any removed test in the pull request.
4. Open a pull request. The template pre-fills a checklist; fill it in honestly.
5. Wait for the checks, address review comments, and merge once approved.

Keep pull requests small and about one thing. A new component, a token change, and a refactor are three pull requests.

## Checks

The Test check runs on every pull request and must pass before merging. Chromatic runs after merging, on `main`. (It's paused for now: see the warning in `README.md`.)

- **Test** (`.github/workflows/test.yml`): typecheck, the contrast and rules checks, build, unit tests, and every story run as a test in Chromium, including the accessibility checks.
- **Chromatic** (`.github/workflows/chromatic.yml`): on every push to `main`, publishes Storybook and compares the stories the change affects with the last build (`--only-changed`). It doesn't run on pull requests, to save snapshots. Its check passes even when snapshots changed, because it runs with `--exit-zero-on-changes`; changes wait in Chromatic's web app until someone accepts them as baselines.

## Reviewing a pull request

- Run Storybook on the branch (`pnpm storybook`) and use the component: keyboard, focus, and all three themes.
- After merging, review Chromatic's visual diff for the `main` build. Accept a change only if it was intended.
- Read the tests as well as the component. A test should fail if the behavior it covers breaks.
- A deleted, skipped, or weakened test needs an explicit reason in the pull request description.

## Screenshots and recordings

Chromatic shows how every story looks once a change is on `main`, so pull requests don't need screenshots. Add a recording only for motion and multi-step interactions, which still images can't show.
