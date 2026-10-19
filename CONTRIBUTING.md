# Contributing

Read `CLAUDE.md` first. It has the rules for tokens, CSS, accessibility, motion, and tests, and it applies to people as much as to AI tools. The brand book in `docs/brand/` explains the reasons.

## Workflow

1. Branch from `main`, for example `add-input` or `fix-button-focus`.
2. Make the change. Follow the "Adding a component" steps in `CLAUDE.md` for a new component.
3. Run `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm build-storybook`. All four must pass.
4. Open a pull request. The template pre-fills a checklist; fill it in honestly.
5. Wait for the checks, address review comments, and merge once approved.

Keep pull requests small and about one thing. A new component, a token change, and a refactor are three pull requests.

## Checks

Two checks run on every pull request. Both must pass before merging.

- **Test** (`.github/workflows/test.yml`): typecheck, build, unit tests, and every story run as a test in Chromium, including the accessibility checks.
- **Chromatic** (`.github/workflows/chromatic.yml`): publishes Storybook and compares every story to `main`.

## Reviewing a pull request

- Open the Storybook preview that Chromatic links to, and use the component: keyboard, focus, and all three themes.
- Review Chromatic's visual diff. Accept a change only if it was intended.
- Read the tests as well as the component. A test should fail if the behavior it covers breaks.
- A deleted, skipped, or weakened test needs an explicit reason in the pull request description.

## Screenshots and recordings

Chromatic already shows how every story looks, so pull requests don't need screenshots. Add a recording only for motion and multi-step interactions, which still images can't show.
