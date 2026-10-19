# CLAUDE.md

Instructions for working in this repo. Read this before changing anything.

## What this is

A standalone design system: tokens, CSS, and React components, published as a package that other projects (Astro sites, React apps, possibly in other GitHub orgs) install. The current palette is called Sherbet (tangerine, peach, and mint with espresso ink). It has three themes: `light`, `dark`, and `hotdog` (a deliberate joke theme in ketchup and mustard that still has to pass every accessibility check).

The brand book (principles, voice, color usage, type, layout, motion, iconography, accessibility, and building rules) lives in `docs/brand/*.md`. **This repo is the source of truth.** Storybook's Foundations pages render those files, plus visual blocks drawn from `tokens/tokens.json`. The design system artifact on claude.ai is a copy that gets re-synced from the repo; never treat it as the source.

When a rule or guideline changes, update the matching file in `docs/brand/`. If it's a rule about how code is written, update this file too.

The palette name may change, so never put "Sherbet" in file names, class names, CSS variables, or package names.

## Stack

- React 19, TypeScript 6 (not 7: library tooling doesn't support it yet), Vite 8 in library mode
- Base UI (`@base-ui/react`) for behavior and accessibility; shadcn/ui as a reference for structure
- Tailwind CSS 4, for layout only (see below)
- Storybook 10 with the docs, a11y, and themes addons; published to Chromatic by `.github/workflows/chromatic.yml`
- pnpm 11, pinned in `package.json` (`packageManager`) and run through Corepack. pnpm 11 rejects packages published less than a day ago, and only packages listed under `allowBuilds` in `pnpm-workspace.yaml` may run install scripts.

## Commands

```sh
pnpm storybook        # dev server on http://localhost:6006
pnpm typecheck
pnpm build            # dist/: JS, types, and CSS
pnpm build-storybook
pnpm tokens           # regenerate CSS from tokens/tokens.json (the other scripts do this first)
```

Before saying any change is done, run `pnpm typecheck`, `pnpm build`, and `pnpm build-storybook`, and fix anything they report.

## Layout

```
tokens/tokens.json           single source for colors, sizes, type, spacing, radii, and shadows
scripts/build-tokens.mjs     generates src/styles/tokens.css and src/styles/tailwind-theme.css
scripts/copy-css.mjs         writes the published CSS into dist/
src/styles/                  index.css (layer order and imports), base.css, fonts.css, generated CSS
src/components/<Name>/       Name.tsx, name.css, Name.stories.tsx, index.ts
docs/brand/                  the brand book, one Markdown file per topic
src/foundations/             Storybook docs pages (MDX) that render docs/brand, plus token-driven
                             blocks (colors, type, spacing, radii, shadows, sizing, motion demo).
                             Not part of the published package.
.storybook/                  config and the Light / Dark / Hot dog theme switch
```

## Tokens

- `tokens/tokens.json` is the only place values are defined. `src/styles/tokens.css` and `tailwind-theme.css` are generated: never edit them by hand.
- Two tiers. **Primitives** are the raw palette (`tangerine-500`, `espresso-950`). **Semantic tokens** say what a value is for (`bg`, `surface`, `surface-tint`, `ink`, `ink-muted`, `border`, `border-strong`, `action`, `action-hover`, `on-action`, `link`, `highlight`, `on-highlight`, `focus`, `success`, `warning`, `danger` and their `-soft` versions). **Components use semantic tokens only, never primitives.**
- Semantic colors have a value per theme, usually an alias such as `"{tangerine-500}"`.
- **Colors are HSL only**, written `hsl(H S% L%)`. Never hex, never named colors. If a tool or library outputs hex, convert it.
- Every token has a `usage` note saying where it's used. Text colors name the backgrounds they're checked on.
- No raw values in component CSS. If a value is missing, add a token first.
- Motion tokens (`--duration-*`, `--ease-*`, `--motion-distance`) and the fluid heading sizes are written by `build-tokens.mjs`, because `tokens.json` has no motion family.

## CSS architecture

Two kinds of CSS with a fixed boundary:

| Tailwind utilities, in the markup | Component CSS, in `name.css` |
| --- | --- |
| How a component sits in its context: margin, `gap`, flex and grid, width, position, responsive layout | What a component is: color, type, border, radius, shadow, inner padding, variants, and states |

- Tailwind is for spacing, sizing, and layout only. Its color, font, text, shadow, radius, and easing theme values are switched off in `tailwind-theme.css`. Don't turn them back on.
- Component CSS goes in `@layer components`. Layer order is `theme, base, components, utilities`, so a utility in markup can override a component for a one-off.
- Inner padding belongs to the component, so it's the same size everywhere.
- Components don't set their own outer margin or width. Layout is the consumer's job.

## Classes, variants, and state

One convention per job. Never mix them.

| Job | Convention | Example |
| --- | --- | --- |
| Name a component and its parts | Class | `.button`, `.button__icon` |
| Variant or size (a design choice from a fixed set) | `data-*` attribute | `data-variant="secondary"`, `data-size="sm"` |
| State with an accessibility meaning | ARIA attribute | `aria-pressed`, `aria-current`, `aria-invalid`, `aria-expanded` |
| State without an ARIA meaning | Base UI's `data-*` state attribute | `data-open`, `data-disabled`, `data-highlighted` |

- No modifier classes (`.button--secondary`). No `cva` or class-string variant builders.
- React props map straight to attributes: `variant="secondary"` renders `data-variant="secondary"`.
- Every variant has a default, so a component renders correctly with no `data-variant`.
- Style state from the ARIA attribute whenever one exists, so the visuals and what a screen reader announces can't disagree.

## Units

- **rem** for font sizes, spacing, radii, component sizes, icon sizes, and max widths.
- **px** only for `border-thin` (1px), `border-thick` (2px), `focus-width`, `focus-offset`, and shadow offsets.
- **em** for media queries. Never a px font size, and never set `html { font-size }`.

## Accessibility (requirements, not suggestions)

- Text meets 4.5:1 contrast in every theme (3:1 for 24px+ or bold 19px+). Control borders, focus rings, and meaningful icons meet 3:1. Check all three themes, including hot dog.
- Color never carries meaning alone: add an icon, a word, or a shape.
- Focus is an **outline**, never only a box-shadow: `outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset);`.
- Every control has a border, `transparent` if the design doesn't want one visible, so it shows in Windows forced-colors mode. Selected and checked states never rely on background color alone. Icons use `currentColor`. Add a `@media (forced-colors: active)` block when something would disappear.
- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for inputs. A link that looks like a button is still an `<a>` (see `ButtonLink`). Don't pass `<a>` to a Base UI component's `render` prop.
- Interactive components (dialog, menu, tabs, select, tooltip, popover, and so on) are built on Base UI. Never hand-roll their keyboard handling, focus management, or ARIA.
- Every interactive target is at least `--target-min` (44px) in both directions, using a pseudo-element hit area when the visible control is smaller.
- Icon-only controls require an accessible name; enforce it in the props type.
- Storybook runs axe on every story with `a11y.test: "error"`. A violation is a bug, not something to suppress.

## Motion

- Durations 100–320ms using the motion tokens. Exits are faster than entrances and use `--ease-in`.
- Animate only `transform` and `opacity`.
- Slides and shifts use `--motion-distance` and pops use `--motion-scale`. Looping animations (spinner, skeleton) use `--duration-loop`, which gets slower under reduced motion. Under `prefers-reduced-motion` slides and pops become `0` and `1`, so movement turns into fades without component changes. Never write a separate reduced-motion rule when a token can do it.
- `data-motion="full"` or `data-motion="reduced"` on any element overrides the system setting for that subtree (generated in `tokens.css`).
- `--ease-bounce` only for chips, toggles, and success states.
- Base UI marks entering and leaving elements with `data-starting-style` and `data-ending-style`. Use them for enter and exit transitions in plain CSS.

## Themes

- Set with `data-theme="light" | "dark" | "hotdog"` on `<html>`. With no attribute, light or dark follows `prefers-color-scheme`.
- Hot dog mode uses hard offset shadows and `border-thick` ink outlines; components press into their shadow on `:active`.

## Adding a component

1. If Base UI has a matching primitive, build on it. shadcn's version is a good reference for structure; replace its Tailwind styling with a CSS file that follows the rules above.
2. Create `src/components/<Name>/` with `Name.tsx`, `name.css`, `Name.stories.tsx`, and `index.ts`.
   A closely related sibling that shares the folder's CSS (such as `ButtonLink` next to `Button`) gets its own `.tsx` and stories, and any code the two share goes in `shared.tsx`. Everything else gets its own folder.
3. Write JSDoc on the component and every prop. It becomes the Storybook docs.
4. Import the CSS in `src/styles/index.css` and export the component and its types from `src/index.ts`.
5. Stories: a `Playground` with controls, one story per variant group and state, and an `AllThemes` story that renders every variant and state in all three themes side by side (Chromatic snapshots it).
6. Interaction tests use the `canvas` and `userEvent` passed into `play`, not `within`, `screen`, or an imported `userEvent`.
7. Check contrast and focus in all three themes, then run typecheck, build, and build-storybook.
8. If the component introduces a new rule or pattern, add it to the right page in `docs/brand/`.

## Foundations pages

- Each page in `src/foundations/` renders a `docs/brand/*.md` file with Storybook's `Markdown` block, then adds visual blocks from `src/foundations/blocks.tsx`.
- Blocks read `tokens/tokens.json` directly, so new tokens appear automatically. Don't hard-code token values in them.
- Wrap blocks in `<Unstyled>` so Storybook's docs styles don't override them. Each block has its own Light / Dark / Hot dog switch.
- To add a page: write `docs/brand/<topic>.md`, add `src/foundations/NN-<topic>.mdx`, and add its title to `storySort` in `.storybook/preview.tsx`.

## Writing style

Applies to docs, JSDoc, story descriptions, README text, and any copy in components:

- Always use the Oxford comma.
- Sentence case for headings, buttons, and labels.
- Short, plain sentences. Buttons say exactly what happens ("Send message").
- No emoji in UI or docs.

## Don't

- Edit generated CSS instead of `tokens/tokens.json`.
- Use hex colors, primitive tokens in components, or Tailwind for styling.
- Add modifier classes or `cva`.
- Remove a focus outline without replacing it.
- Upgrade TypeScript to 7 or change the pnpm version without checking that every command still passes.
- Commit secrets. The Chromatic token lives in the repo's GitHub secrets as `CHROMATIC_PROJECT_TOKEN`.
