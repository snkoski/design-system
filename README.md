# Design system

Tokens, styles, and React components for a playful, accessible design system. The current palette is called Sherbet (tangerine, peach, and mint with espresso ink) and ships with three themes: light, dark, and hot dog.

The brand book (principles, voice, color, type, layout, motion, iconography, accessibility, and how to build with it) lives in `docs/brand/`, and Storybook shows it under **Foundations**, next to visual pages for every token. This repo is the source of truth for both the code and the guidelines.

## Getting started

You need Node 22 or newer. The pnpm version is pinned in `package.json` (`packageManager`), and Corepack, which ships with Node, uses that exact version inside this repo.

```sh
corepack enable       # once per machine, if pnpm isn't set up yet
pnpm install
pnpm exec playwright install chromium   # once, for the story tests
pnpm storybook        # opens http://localhost:6006
```

The first time, Corepack may ask to download the pinned pnpm version. That's expected and only happens once.

pnpm 11 refuses packages published less than a day ago, as protection against hijacked releases. Build scripts are allowed only for the packages listed under `allowBuilds` in `pnpm-workspace.yaml`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm storybook` | Runs Storybook locally with live reload |
| `pnpm build` | Builds the package into `dist/` (JavaScript, types, and CSS) |
| `pnpm build-storybook` | Builds a static Storybook into `storybook-static/` |
| `pnpm typecheck` | Checks TypeScript, including the type assertions in test files |
| `pnpm test` | Runs the unit tests (jsdom) and the story tests (Chromium, including accessibility checks) |
| `pnpm test:unit` | Runs only the unit tests; fast |
| `pnpm test:watch` | Runs the unit tests and reruns them as files change |
| `pnpm test:stories` | Runs only the story tests |
| `pnpm test:coverage` | Runs everything and writes a coverage report to `coverage/` |
| `pnpm tokens` | Regenerates the token CSS from `tokens/tokens.json` (the other scripts run this for you) |
| `pnpm chromatic` | Publishes Storybook to Chromatic (needs a project token) |

## How it's organized

```
tokens/tokens.json           the single source for every color, size, and font
scripts/build-tokens.mjs     turns tokens.json into CSS (don't edit the generated CSS)
src/styles/                  tokens.css, base.css, fonts.css, and the Tailwind theme
src/components/<Name>/       Name.tsx, name.css, Name.test.tsx, Name.stories.tsx, index.ts
docs/brand/                  the brand book, one Markdown file per topic
src/foundations/             Storybook Foundations pages: the brand book plus token visuals
.storybook/                  Storybook config, with a Light / Dark / Hot dog theme switch
```

## Rules the code follows

- **Tailwind is for layout only** (spacing, sizing, flex, and grid) in the markup. Everything a component *is* (color, type, border, radius, states, and variants) lives in its own CSS file, in `@layer components`, using tokens.
- **Classes name things, `data-*` attributes pick variants, ARIA attributes carry state.** No modifier classes.
- **Components only use semantic tokens** (`--action`, `--ink`), never primitives (`--tangerine-500`).
- **HSL only** for colors. **rem** for sizes; **px** only for borders, focus rings, and shadow offsets.
- **Focus is an outline**, never only a shadow. Every control has a border (transparent if needed) so it survives Windows Contrast themes.
- **Every story is checked for accessibility.** Violations fail the story (`a11y.test: "error"`).
- **Every component has a test file.** `Name.test.tsx` covers behavior with Vitest and Testing Library. Stories also run as tests in Chromium, so accessibility checks run against the real CSS. See the Testing section of `CLAUDE.md`.

## Using it in another project

Until it's published as a package, install it straight from GitHub:

```sh
pnpm add github:<your-username>/design-system
```

Then, once, at the root of the app:

```ts
import "design-system/fonts.css";
import "design-system/styles.css";
import { Button } from "design-system";
```

If the app uses Tailwind, add the layout-only theme after Tailwind:

```css
@import "tailwindcss";
@import "design-system/tailwind-theme.css";
```

Set the theme with `data-theme="light" | "dark" | "hotdog"` on `<html>`. With no attribute, light or dark follows the visitor's system setting.

## Adding a component

1. If Base UI has a matching primitive (dialog, menu, tabs, popover…), build on it. shadcn's version of the component is a good starting point for structure; swap its Tailwind styling for a CSS file that follows the rules above.
2. Create `src/components/<Name>/` with the component, its CSS, a test file, stories, and an `index.ts`.
3. Import its CSS in `src/styles/index.css` and export it from `src/index.ts`.
4. Add an `AllThemes` story so Chromatic snapshots it in every theme.
5. Run `pnpm typecheck` and `pnpm test`. Copy the structure of `Button.test.tsx`.

## Contributing

See `CONTRIBUTING.md` for the pull request workflow and the checks every change must pass.

## Publishing Storybook to Chromatic

1. Sign in at chromatic.com with GitHub and create a project from this repo.
2. Copy the project token into the repo's secrets as `CHROMATIC_PROJECT_TOKEN` (GitHub → Settings → Secrets and variables → Actions).
3. Push to `main`. The workflow in `.github/workflows/chromatic.yml` publishes Storybook and runs visual tests on every push and pull request.
