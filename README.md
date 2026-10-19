# Design system

Tokens, styles, and React components for a playful, accessible design system. The current palette is called Sherbet (tangerine, peach, and mint with espresso ink) and ships with three themes: light, dark, and hot dog.

The brand book (principles, voice, color, type, accessibility, and motion rules) lives in the Sherbet design system artifact on claude.ai. This repo is the code that implements it.

## Getting started

You need Node 22 or newer. The pnpm version is pinned in `package.json` (`packageManager`), and Corepack, which ships with Node, uses that exact version inside this repo.

```sh
corepack enable       # once per machine, if pnpm isn't set up yet
pnpm install
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
| `pnpm typecheck` | Checks TypeScript |
| `pnpm tokens` | Regenerates the token CSS from `tokens/tokens.json` (the other scripts run this for you) |
| `pnpm chromatic` | Publishes Storybook to Chromatic (needs a project token) |

## How it's organized

```
tokens/tokens.json           the single source for every color, size, and font
scripts/build-tokens.mjs     turns tokens.json into CSS (don't edit the generated CSS)
src/styles/                  tokens.css, base.css, fonts.css, and the Tailwind theme
src/components/<Name>/       Name.tsx, name.css, Name.stories.tsx, index.ts
.storybook/                  Storybook config, with a Light / Dark / Hot dog theme switch
```

## Rules the code follows

- **Tailwind is for layout only** (spacing, sizing, flex, and grid) in the markup. Everything a component *is* (color, type, border, radius, states, and variants) lives in its own CSS file, in `@layer components`, using tokens.
- **Classes name things, `data-*` attributes pick variants, ARIA attributes carry state.** No modifier classes.
- **Components only use semantic tokens** (`--action`, `--ink`), never primitives (`--tangerine-500`).
- **HSL only** for colors. **rem** for sizes; **px** only for borders, focus rings, and shadow offsets.
- **Focus is an outline**, never only a shadow. Every control has a border (transparent if needed) so it survives Windows Contrast themes.
- **Every story is checked for accessibility.** Violations fail the story (`a11y.test: "error"`).

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
2. Create `src/components/<Name>/` with the component, its CSS, stories, and an `index.ts`.
3. Import its CSS in `src/styles/index.css` and export it from `src/index.ts`.
4. Add an `AllThemes` story so Chromatic snapshots it in every theme.

## Publishing Storybook to Chromatic

1. Sign in at chromatic.com with GitHub and create a project from this repo.
2. Copy the project token into the repo's secrets as `CHROMATIC_PROJECT_TOKEN` (GitHub → Settings → Secrets and variables → Actions).
3. Push to `main`. The workflow in `.github/workflows/chromatic.yml` publishes Storybook and runs visual tests on every push and pull request.
