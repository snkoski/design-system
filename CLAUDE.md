# CLAUDE.md

Instructions for working in this repo. Read this before changing anything.

## What this is

A standalone design system: tokens, CSS, and React components, published as a package that other projects (Astro sites, React apps, possibly in other GitHub orgs) install. The current palette is called Sherbet (tangerine, peach, and mint). Components are neutral (black, white, and grays) and the brand colors live in the layout around them, so the components can serve other brands too. It has three themes: `light`, `dark`, and `hotdog` (a deliberate joke theme in ketchup and mustard that still has to pass every accessibility check).

The brand book (principles, voice, color usage, type, layout, motion, iconography, accessibility, and building rules) lives in `docs/brand/*.md`. **This repo is the source of truth.** Storybook's Foundations pages render those files, plus visual blocks drawn from `tokens/tokens.json`. The design system artifact on claude.ai is a copy that gets re-synced from the repo; never treat it as the source.

When a rule or guideline changes, update the matching file in `docs/brand/`. If it's a rule about how code is written, update this file too.

## Open questions block new components

`docs/proposed-roadmap-job-tracker.md` plans the next components and moving the job tracker app onto the system. Its "Open questions" table must be fully answered before any new component is started. The planned font trial can go first; anything that adds a component waits. If someone asks for a new component while a question there is still "Open", say so and point to the question before doing anything else.

When a question is decided, follow "The rule" at the top of that file: record the answer there, move it into this file or `docs/brand/`, delete any matching `docs/revisit.md` entry, and copy the file to the job tracker (`~/Development/job-tracker/proposed-roadmap-job-tracker.md`). This repo's copy is the one to edit.

## Visual tests are paused

Chromatic's workflow has been switched off on GitHub since 2026-10-27, to save the free plan's snapshots while the components are still being built. The Test workflow still runs every story's play function and axe, but nothing checks how stories look, so look at every visual change yourself (see "Looking at a component").

Tell the user it's still off whenever a component is finished, or when the system gets close to a first beta: that's when to turn it back on with `gh workflow enable Chromatic`, push to `main`, and accept the new snapshots as baselines in Chromatic's web app. Then delete this section and the warning in `README.md`, and the "PAUSED" note in `.github/workflows/chromatic.yml`.

Decisions made for now that we may want to change, and open questions, go in `docs/revisit.md`: what we do today, why, and what would settle it. Check it before changing anything it mentions.

The palette name may change, so never put "Sherbet" in file names, class names, CSS variables, or package names.

## Stack

- React 19, TypeScript 6 (not 7: library tooling doesn't support it yet), Vite 8 in library mode
- Base UI (`@base-ui/react`) for behavior and accessibility; shadcn/ui as a reference for structure
- Tailwind CSS 4, for layout only (see below)
- Storybook 10 with the docs, a11y, themes, and Vitest addons; published to Chromatic by `.github/workflows/chromatic.yml`
- Vitest 5 with Testing Library (jsdom) for unit tests, and Storybook's Vitest addon to run every story in Chromium (Playwright). `.github/workflows/test.yml` runs it all on every push and pull request.
- pnpm 11, pinned in `package.json` (`packageManager`) and run through Corepack. pnpm 11 rejects packages published less than a day ago, and only packages listed under `allowBuilds` in `pnpm-workspace.yaml` may run install scripts.

## Commands

```sh
pnpm storybook        # dev server on http://localhost:6006
pnpm typecheck
pnpm build            # dist/: JS, types, and CSS
pnpm build-storybook
pnpm test             # unit tests (jsdom) and story tests (Chromium); first time: pnpm exec playwright install chromium
pnpm test:unit        # unit tests only, fast
pnpm test:watch       # unit tests in watch mode
pnpm test:stories     # story tests only (play functions and axe)
pnpm test:coverage
pnpm check            # contrast of every color pair in all themes, and the rules in this file (CSS, structure, imports)
pnpm check:tests      # fails if tests were deleted, skipped, or weakened compared with HEAD (or --base <ref>)
pnpm check:contrast --probe ink-muted:track:4.5   # try color pairs without adding them; --opacity 0.5 for dimmed parts
pnpm look <Name>      # in the built Storybook: every story's result, screenshots, and state colors (see "Looking at a component")
pnpm tokens           # regenerate CSS from tokens/tokens.json (the other scripts do this first)
pnpm reading-list     # regenerate docs/reading-list.md and .html from docs/reading-list.json
```

Before saying any change is done, run `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm build-storybook`, and fix anything they report. `pnpm typecheck` also checks the type-level assertions (`expectTypeOf`) in test files.

## Layout

```
tokens/tokens.json           single source for colors, sizes, type, spacing, radii, and shadows
scripts/build-tokens.mjs     generates src/styles/tokens.css and src/styles/tailwind-theme.css
scripts/copy-css.mjs         writes the published CSS into dist/
src/styles/                  index.css (layer order and imports), base.css, fonts.css, generated CSS
src/components/<Name>/       Name.tsx, name.css, Name.test.tsx, Name.stories.tsx, index.ts
src/internal/                pieces several components share (cx, FieldError and field-error.css, ReadOnlyNote and
                             read-only-note.css, SpinnerGraphic and spinner-graphic.css, bar.ts and bar.css for the look Meter and
                             Progress share, useLoadingAnnouncement, warn), with tests, the CSS
                             form controls share (field.css, text-field.css, choice.css, choice-group.css), and
                             visually-hidden.css (the `.visually-hidden` class for screen-reader-only text). Not
                             exported from the package; the CSS is part of the published stylesheet.
tests/setup.ts               setup for the unit tests (jest-dom matchers, cleanup, fail on unexpected warnings)
tests/warnings.ts            takeWarnings(), for tests that expect a dev warning
tokens/contrast.json         every foreground and background color pair the components use, with its minimum ratio
scripts/check-*.mjs          pnpm check (contrast, rules), pnpm check:tests, and check-dist (run by pnpm build)
scripts/look.mjs             pnpm look: a component's stories, screenshots, and state colors in the built Storybook
.claude/settings.json        a hook that warns when tests are removed, skipped, or weakened
vitest.config.ts             two projects: `unit` (jsdom) and `storybook` (Chromium)
docs/brand/                  the brand book, one Markdown file per topic
docs/revisit.md              decisions to come back to, and open questions
docs/reading-list.json       articles and design system pages to read later: the only place links are added
docs/reading-list.md, .html  generated from the JSON by scripts/build-reading-list.mjs (pnpm reading-list); never edit
src/experiments/             ideas being tried out; relaxed rules, never published (see Experiments)
src/foundations/             Storybook docs pages (MDX) that render docs/brand, plus token-driven
                             blocks (colors, type, spacing, radii, shadows, sizing, motion demo).
                             Not part of the published package.
src/how-it-works/            the pieces of every "How it works" page: <Code> (real source, read when the page loads),
                             <Inspect> (a component's live HTML), and the demos components' pages use. Not published.
.storybook/                  config and the Light / Dark / Hot dog theme switch
```

## Imports

Every import, in TypeScript, MDX, and CSS alike, starts from an alias, never with `./` or `../`, even for a file in the same folder: `import { cx } from "@/internal/cx"`, `@import "@/components/Meter/meter.css"`.

| Alias | Folder | Example |
| --- | --- | --- |
| `@/` | `src/` | `@/components/Progress/Progress` |
| `@docs/` | `docs/` | `@docs/brand/loading.md?raw` |
| `@tokens/` | `tokens/` | `@tokens/tokens.json` |
| `@tests/` | `tests/` | `@tests/warnings` |

- The aliases are defined twice, in `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`paths`). Keep them in step.
- The one exception: a docs page (`.mdx`) imports the stories it's attached to as `./Name.stories`. Storybook finds the stories behind `<Meta of={…}>` by following that path itself, and it only understands a relative one there.
- `pnpm check` fails on any other relative import in `src/` or `tests/` (rule `relative-import`).
- The aliases only mean something inside this repo. `pnpm build` runs `tsc-alias` to turn them back into relative paths in the published `.d.ts` files, `scripts/copy-css.mjs` inlines the CSS imports into one `styles.css`, and `scripts/check-dist.mjs` fails the build if any alias is left in `dist/`.

## Tokens

- `tokens/tokens.json` is the only place values are defined. `src/styles/tokens.css` and `tailwind-theme.css` are generated: never edit them by hand.
- Two tiers. **Primitives** are the raw palette (`tangerine-500`, `gray-900`). **Semantic tokens** say what a value is for (`bg`, `surface`, `surface-tint`, `surface-hover`, `track`, `track-hover`, `ink`, `ink-muted`, `border`, `border-strong`, `action`, `action-hover`, `on-action`, `brand`, `on-brand`, `link`, `highlight`, `on-highlight`, `focus`, `success`, `warning`, `danger` and their `-soft` versions). **Components use semantic tokens only, never primitives.**
- **Components are neutral.** The tokens they draw with (`surface`, `surface-hover`, `track`, `track-hover`, `ink`, `ink-muted`, `border`, `border-strong`, `action`, `action-hover`, `on-action`, `focus`) point at the pure gray scale (`gray-*`, plus `white` and `char-950`), never at a brand hue. `brand`, `on-brand`, `surface-tint`, `link`, `highlight`, and `on-highlight` are for layouts, and `pnpm check` fails if a component uses them. A link inside a component is `ink` and underlined (`src/internal/field.css` does this for any link in a form control's label, description, or error), and a tag or chip is gray. Page structure (AppShell, PageHeader) is ordinary components too, with no layouts tier: an app that wants its brand there sets it with its own CSS on the wrapper. A hover fill is `surface-hover`. Status colors (`success`, `warning`, `danger`) are fine where they carry meaning. See `docs/brand/color.md`.
- Semantic colors have a value per theme, usually an alias such as `"{tangerine-500}"`.
- **Colors are HSL only**, written `hsl(H S% L%)`. Never hex, never named colors. If a tool or library outputs hex, convert it.
- Every token has a `usage` note saying where it's used. Text colors name the backgrounds they're checked on.
- No raw values in component CSS. If a value is missing, add a token first.
- Motion tokens (`--duration-*`, `--ease-*`, `--motion-distance`) and the fluid heading sizes are written by `build-tokens.mjs`, because `tokens.json` has no motion family.
- A size token can also have a `touch` value, used whenever a touch screen is present or under `data-pointer="coarse"`, and a `compact` value, used under `data-density="compact"` but never below `--target-min`. `build-tokens.mjs` writes the rules for both from `tokens.json`; don't hard-code them in the script.

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
- **lh** and **em** elsewhere only where a part must match the text around it: TextArea's padding and Badge's corners use `1lh`, and Skeleton's text lines are `1lh` tall with a `1em` bar.

## Accessibility (requirements, not suggestions)

- Text meets 4.5:1 contrast in every theme (3:1 for 24px+ or bold 19px+). Control borders, focus rings, and meaningful icons meet 3:1. Check all three themes, including hot dog.
- Color never carries meaning alone: add an icon, a word, or a shape.
- Focus is an **outline**, never only a box-shadow: `outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset);`.
- Every control has a border, `transparent` if the design doesn't want one visible, so it shows in Windows forced-colors mode. Connected options (a segmented control's) share one: the track's edge and the lines between options. Selected and checked states never rely on background color alone. Icons use `currentColor`. Add a `@media (forced-colors: active)` block when something would disappear. Text on a `Highlight` fill (a chosen segment) needs `forced-color-adjust: none` there, or the browser's Canvas backplate behind the text hides it. Hover rules are usually more specific than the forced-colors overrides and win, so repeat the hover selectors for checked or selected states inside that block (a hovered "on" switch otherwise loses its fill and hides the thumb).
- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for inputs. A link that looks like a button is still an `<a>` (see `ButtonLink`). Don't pass `<a>` to a Base UI component's `render` prop.
- **Links and routers.** Nothing in the system knows about a router. A component that is one link renders a plain `<a>`, spreads every other prop onto it, and accepts a `ref`, so an app wraps it with its router (TanStack Router's `createLink(ButtonLink)`, tested with TanStack Router 1.170). A component with several links inside (Breadcrumbs, side navigation, pagination) takes them as children, so the app passes its own router links, and the component does the layout, separators, and `aria-current`. Its test file checks that a router's props (`href`, `onClick`, `aria-current`, `data-*`, `ref`) pass through, as ButtonLink's does. No link provider or context.
- Interactive components (dialog, menu, tabs, select, tooltip, popover, and so on) are built on Base UI. Never hand-roll their keyboard handling, focus management, or ARIA. A native form element the browser handles completely (`<input>`, `<textarea>`, `<select>`) also counts, rendered through Base UI's `Field.Control`: the browser does the keyboard and ARIA. So there are two selects: NativeSelect (a `<select>`, the default for forms) and Select (Base UI's, only when options need more than plain text, such as icons or a second line). Where Base UI has nothing, use a well-tested library that follows the ARIA Authoring Practices rather than hand-rolling one: DatePicker's calendar is React DayPicker inside Base UI's Popover, as in shadcn's Base UI date picker. Style it with our CSS, never the library's stylesheet or Tailwind classes.
- Every interactive target's hit area is at least `--target-min` in both directions: 24px with a mouse (WCAG 2.2 AA) and 44px when a touch screen is present. When the visible control is smaller, extend it with an invisible pseudo-element (see `.button::after`). The one exception is the resize handle the browser draws on a text area (see `docs/brand/accessibility.md`). Separate small targets are at least `--target-gap` (8px) apart.
- Focus must never be hidden behind sticky headers or footers (use `scroll-padding`). Anything done by dragging also works with a tap or click.
- Icon-only controls require an accessible name; enforce it in the props type.
- Text for screen readers only uses the shared `.visually-hidden` class (`src/internal/visually-hidden.css`), next to the part's own class. Never write another copy of its rule. A prop that hides a visible part from view but not from screen readers (Spinner's `hideLabel`) adds `.visually-hidden` to that part, with no `data-*` attribute of its own: this is the one place a class is switched on by a prop.
- Storybook runs axe on every story with `a11y.test: "error"`. A violation is a bug, not something to suppress.

## Motion

- Durations 100–320ms using the motion tokens. Exits are faster than entrances and use `--ease-in`.
- Movement, entrances, and exits animate only `transform` and `opacity`. A control's state change (hover, press, checked, invalid) may also fade `color`, `background-color`, `border-color`, and `box-shadow` over `--duration-fast`. List the properties; never `transition: all`. Never animate layout properties (width, height, top, left, margin, padding).
- Slides and shifts use `--motion-distance` and pops use `--motion-scale`. Looping animations (spinner, skeleton, a progress bar of unknown length) use `--duration-loop` (a skeleton's pulse and a progress bar's slide are two loops), which gets slower under reduced motion. They are the one thing allowed to move on their own for more than 5 seconds with no pause control, since they last as long as the wait (`docs/brand/motion.md`). Under `prefers-reduced-motion` slides and pops become `0` and `1`, so movement turns into fades without component changes. Never write a separate reduced-motion rule when a token can do it.
- Movement that shows state (a switch thumb sliding to "on") is not decoration: give it a fixed distance, not `--motion-distance`, so it still moves under reduced motion. `--ease-bounce` turns into a plain ease-out there; `--duration-fast` stays the same, and is already short.
- `data-motion="full"` or `data-motion="reduced"` on any element overrides the system setting for that subtree (generated in `tokens.css`).
- `--ease-bounce` only for chips, toggles, and success states.
- Base UI marks entering and leaving elements with `data-starting-style` and `data-ending-style`. Use them for enter and exit transitions in plain CSS.

## Sizing: mouse, touch, and density

- A size token's `value` is for a mouse or trackpad. `--target-min`, `--choice-row`, `--control-md`, and `--control-lg` also have a `touch` value, which `build-tokens.mjs` applies under `@media (any-pointer: coarse)` (any touch input, so touchscreen laptops count). Don't switch on the *primary* pointer.
- `data-pointer="coarse"` or `"fine"` on an element forces one mode for that subtree. `data-density="compact"` shrinks `--control-md` and `--control-lg` one step (their `compact` values) for desktop tables and toolbars, but never below `--target-min`, so on touch they stay 44px and text fields stay full targets; comfortable is the default.
- Components size themselves only with these tokens, never with their own pointer or density media queries, so every mode works automatically. Check new components with Storybook's Foundations → Mouse, touch, and screen size switches, or by wrapping a story in `data-pointer="coarse"`. Story checks of sizes and hit areas run in both modes (see Testing).
- Text never changes size with pointer or density. Body text is the same size on every screen; only headings and page-level spacing scale with width.
- Breakpoints are the `breakpoint` tokens (40em, 48em, 64em, 80em, and 96em), used as Tailwind's `sm:` to `2xl:`. Design for 320px wide first.
- `docs/brand/platforms.md` explains the reasoning and what each major platform does.

## Forms and copy

Follow `docs/brand/forms.md` and `docs/brand/voice.md`. The essentials:

- Visible label above every field, no colon, never a placeholder as the label. Help text between label and field.
- Mark optional fields with "(optional)"; no asterisks. A checkbox group that needs at least one choice says "(required)" in its label.
- Validate on submit, then re-check a field as it changes. Never re-check on blur: an error vanishing as focus moves to the submit button shifts the button out from under the click. Never disable the submit button to signal an incomplete form.
- Errors in words next to the field, with `aria-invalid` and `aria-describedby`. An error summary at the top for two or more errors, focused on submit.
- Buttons start with a verb, have no punctuation, and say exactly what happens. Error messages say what went wrong and how to fix it, with no blame, jokes, "invalid," or "oops."

## Themes

- Set with `data-theme="light" | "dark" | "hotdog"` on `<html>`. With no attribute, light or dark follows `prefers-color-scheme`.
- Hot dog mode uses hard offset shadows and `border-thick` ink outlines; components you click (buttons, checkboxes, switches) press into their shadow on `:active`. Text fields don't press: you type in them, so they keep their shadow. NativeSelect doesn't press either, though you click it: it's a field beside other fields in a form, and the browser opens its list anchored to the field, which shouldn't jump. A segmented control's options don't press either: the shadow belongs to the whole track.

## Adding a component

Build a new component with `/new-component <Name>` (`.claude/skills/new-component/`). The skill holds the order of work, the proposal the user approves before any code, and the checks for each kind of component. This list is what a finished component has, however it was built:

0. Every question in `docs/proposed-roadmap-job-tracker.md` was answered before it was started (see "Open questions block new components").
1. It's built on Base UI's matching primitive, if there is one, and styled from the attributes that primitive actually renders. Base UI's docs ship with the package at `node_modules/@base-ui/react/docs/react/components/<name>.md` and are authoritative. shadcn's version is a reference for structure only; its Tailwind styling is replaced with a CSS file that follows the rules above.
2. Its folder, `src/components/<Name>/`, has `Name.tsx`, `name.css`, `Name.test.tsx`, `Name.stories.tsx`, and `index.ts`. The test file is not optional (see Testing).
   A closely related sibling that shares the folder's CSS (such as `ButtonLink` next to `Button`) gets its own `.tsx`, test file, and stories, and any code the two share goes in `shared.tsx`. Everything else gets its own folder.
3. JSDoc on the component and every prop. It becomes the Storybook docs.
4. Its CSS is imported in `src/styles/index.css`, and the component and its types are exported from `src/index.ts`.
5. Stories: a `Playground` with controls, a `States` story with every state side by side, one story per variant group and state, and an `AllThemes` story that renders every variant and state in all three themes side by side (Chromatic snapshots it). Checks of sizes and hit areas run with a mouse and on touch (see Testing). Labels, descriptions, and errors in stories follow `docs/brand/voice.md`, like real copy.
6. Interaction tests in stories use the `canvas` and `userEvent` passed into `play`, not `within`, `screen`, or an imported `userEvent`.
7. Every new foreground and background color pair is in `tokens/contrast.json`, and focus is checked in all three themes.
8. Someone has looked at it. Passing tests don't show whether it looks right: run `pnpm look` (below) and check the `AllThemes` screenshots for alignment, every state, and hot dog mode by eye, and again with `data-pointer="coarse"` and inside `data-density="compact"`.
9. A new rule or pattern it introduces is on the right page in `docs/brand/`. If people need help deciding when to use it or which variant to pick, a guidance page, `docs/brand/<topic>.md`, is rendered by a `<Name>.mdx` beside the stories (see `buttons.md` and `Button.mdx`). If the major design systems handle it differently, `docs/brand/industry.md` has a section or row with what Sherbet chose.
10. A "How it works" page, `HowItWorks.mdx`, beside the stories (see "How it works pages").

### Looking at a component

```sh
pnpm build-storybook
pnpm look <Name> --out <scratchpad>/<name>     # <Name> is the stories file's name: Switch, ButtonLink, LookAt
```

`scripts/look.mjs` serves `storybook-static` on a free port while it runs (so worktrees don't collide, and nothing is left running), and warns if the build is older than the source. It:

- Loads every story of the component and reports its phase and any page or console error. Each must reach `finished` with no error. A `play` function that throws still reaches `finished`, but logs an error. A story that keeps changing on its own (a simulated upload) reports `completing`, which isn't a failure.
- Screenshots the `AllThemes` story in each theme, the light theme with `data-pointer="coarse"` and with `data-density="compact"`, the light theme in forced colors, and the first focusable control in each theme with keyboard focus.
- Prints the fill and top edge of each state (`aria-checked`, `aria-invalid`, `aria-selected`, `data-disabled`, and so on) in the light theme, at rest and hovered, in normal mode and forced colors, beside forced colors' `Canvas`. It flags a state that hover changes and one that matches `Canvas` at rest, for you to judge.

Exit code 1 means a story failed or logged an error. The script finds things to look at; it doesn't decide what looks right. Open every screenshot with the Read tool, and keep them in a scratch folder, not the repo.

For a check it doesn't make, write a Playwright script and run it from the repo folder with `node --input-type=module` (a script saved elsewhere can't find `playwright`), against a server you start yourself: `python3 -m http.server <port> -d storybook-static`, on a port no other session uses, stopped afterwards. Story ids are the title and story name in kebab case (`Components/Button link` and `AllThemes` become `components-button-link--all-themes`).

To try a color pair before adding it to `tokens/contrast.json`, or to check a part dimmed with `opacity`, use the probe, which doesn't touch the file: `pnpm check:contrast --probe ink-muted:track:4.5 border-strong:surface-hover:3`, adding `--opacity 0.5 --page bg` for a dimmed part.

## Testing

**Never delete, skip, weaken, or comment out a test to make a component pass. Only delete a test when the user explicitly tells you to, and never in any other circumstance.** If a test fails, the component is wrong or the test has a bug: fix the component, or tell the user why you think the test is wrong and let them decide. This also covers `it.skip`, `it.todo`, loosening an assertion until it passes, and removing a story's `play` function.

Every component has a thorough `Name.test.tsx` next to it, and every story is also run as a test. Button's test file is the template; copy its structure.

| Layer | Where | Covers |
| --- | --- | --- |
| Unit tests | `Name.test.tsx`, Vitest and Testing Library in jsdom | Behavior: props becoming attributes, ARIA state, keyboard use, callbacks, refs, `className` merging, disabled and loading, form behavior, and prop types |
| Story tests | `Name.stories.tsx`, run in Chromium by Storybook's Vitest addon | Every story renders, `play` functions pass, and axe finds no violations (`a11y.test: "error"`), in the real CSS |
| Visual tests | Chromatic, from the `AllThemes` story | Appearance in all three themes |

- Query by role and accessible name (`getByRole("button", { name })`), the way a user or screen reader finds things. Use test ids only as a last resort.
- Use `userEvent.setup()` for interactions. Test with the keyboard (Tab, Enter, Space, Escape, arrows) as well as the mouse.
- For each component, cover: default rendering and defaults; every variant and size; each state (disabled, loading, invalid, checked, open, and so on) including that it blocks what it should; keyboard operation and focus order; accessible name and role; hidden decorative content; controlled and uncontrolled use; callbacks; ref forwarding; extra props passing through; and consumer `className` merging.
- Test types with `expectTypeOf` in the test file, for example that an icon-only button requires `aria-label`. These run in `pnpm typecheck`, not in Vitest.
- jsdom has no layout and no real CSS. Don't try to test focus rings, contrast, target size, forced colors, or anything that depends on CSS (such as `pointer-events`) there: those belong to the story tests, Chromatic, and manual checks. A story's `play` function can check CSS-dependent behavior in Chromium, for example with a real hit-test: `document.elementFromPoint(x, y)` at an icon's center must return the input (see Input's `WithIcons` story). If a Base UI popup needs a browser API that jsdom lacks (`ResizeObserver`, `matchMedia`, and similar), stub it in `tests/setup.ts`.
- Storybook loads Tailwind's reset, which a consuming site may not have, so it hides the browser's own look for elements like `<hr>`, `<fieldset>`, and `<legend>`. A component that renders one resets those styles in its own CSS, and a story checks them in a shadow root that holds only the component's CSS, which no reset reaches (see Separator's `WithoutCssReset`).
- TypeScript doesn't check hyphenated JSX attributes (`aria-*`, `data-*`) against a props type, so leaving one out of the type doesn't stop it compiling. Check it's absent with `expectTypeOf<Props>().not.toHaveProperty("aria-hidden")`, not with `@ts-expect-error`.
- Sizes depend on the pointer, and story tests run with a mouse. There `--target-min` is 24px, smaller than most controls, so a size or hit-area check that only runs with a mouse passes even when the touch hit area is broken. Check both: mouse first, then set `canvasElement.dataset.pointer = "coarse"`, check again inside `try`, and delete it in `finally` (see Radio's `WithoutVisibleLabel`). Measure tokens with a probe element inside `canvasElement`, so `data-pointer` reaches it, rather than hard-coding px, and also assert the floor (`--target-min` at least 24px with a mouse and 44px on touch), so a token mistake can't make the check pass by default.
- Define a story decorator that uses its context argument (`(Story, { parameters }) => …`) as a typed `const` outside `meta`, with the `Decorator` type. Written inline inside `meta`, it breaks Storybook's inference and every story's args become `never`.
- Keep `play` functions in stories short, to show the main interaction. Put exhaustive cases in the test file so nothing is tested twice.
- Anything that listens for an event a `play` function sends straight after rendering (a pointer move, say) subscribes in `useLayoutEffect`, not `useEffect`. In a built Storybook, as on Chromatic, the passive effect runs after the play function has started, so the first event is lost; the dev server's timing hides this. Check those stories in a built Storybook (`pnpm build-storybook`, then `pnpm look <Name>`), not only with `pnpm test`. LookAt and LookAtCanvas both hit this.
- When fixing a bug, add the test that would have caught it first.
- Check that a new test can fail: break the code on purpose and confirm the test catches it.
- A test that only asserts something is absent (`not.toBeInTheDocument`, an empty `FormData`, `not.toMatch`) also passes when nothing renders at all. Assert a positive precondition first, such as the control or hidden input existing. Writing tests against a stub that renders `null` exposes these: every runtime test should fail there.
- jest-dom's `toBeRequired` only understands some roles, not `switch`. For those, check `aria-required` and the hidden input's `required` directly, and check that a negative assertion can actually fail.
- A hook in `.claude/settings.json` runs `scripts/check-tests-kept.mjs` after edits to test and story files, and after shell commands that remove them. If it reports removed, skipped, or weakened tests, put them back unless the user explicitly asked for the removal. `pnpm check:tests` runs the same check by hand.

## Form controls

Checkbox is the pattern for choice controls (checkboxes, switches, radios), and Input for text fields (TextArea follows it). SegmentedControl is a RadioGroup drawn as connected buttons. Follow them:

- **No form library in components.** Components never import or depend on a form library (react-hook-form, TanStack Form, Formik, Conform, and so on) and never decide for themselves when a value is valid: no Base UI `validate` or `validationMode`. They take `invalid` and `error` props, accept `ref` and `name`, can be controlled or uncontrolled (a text field passes `onChange` and `onBlur` through; a choice control has `onCheckedChange` or `onValueChange`), and submit their value with the native form, so any library, or none, can drive them. When to check a field is the page's job, following `docs/brand/forms.md`.
- **Shared CSS.** What form controls have in common is styled once, in `src/internal/`: `field.css` (`.field-label`, `.field-description`), `text-field.css` (`.text-field`, `.text-field__control`, for Input, TextArea, and NativeSelect), `choice.css` (`.choice`, `.choice__row`, `.choice__label`, `.choice__control`, `.choice__indicator`, for Checkbox, Radio, and Switch), and `choice-group.css` (`.choice-group`, `.choice-group__group`, `.choice-group__options`, for CheckboxGroup, RadioGroup, and SegmentedControl). Each part carries the shared class first and its own class next to it (`className="choice__control checkbox__box"`), and the component's own CSS keeps only what's different (sizes, shapes, icons, marks, and placement). Change a shared look in the shared file, never by overriding it in one component, and never copy a shared rule into a component. `src/styles/index.css` imports the shared files before the components' CSS, so at equal specificity a component's own rule wins. A new form control uses them: NativeSelect is a `text-field`, and so will a NumberField be. A How it works page shows a shared rule with `<Code file="internal/choice.css" … />`, and Input's and Checkbox's pages explain the shared rules in full.
- Wrap the control in Base UI's `Field.Root`, put the label in `Field.Label`, and render the `description` prop with `Field.Description` and the `error` prop with the shared `FieldError` (`src/internal/`), passing the part's own class (`className="checkbox__error"`). `FieldError` draws the icon and the words, so every control's error looks the same; the component's CSS only places it. Base UI then links them with `aria-labelledby`, `aria-describedby`, and `aria-invalid`, so don't set those by hand.
- A group of choice controls (CheckboxGroup is the pattern) is one field: `Field.Root` around a `Fieldset.Root` rendered as Base UI's group, with its label in `Fieldset.Legend`. A control inside a group renders `Field.Item` instead of its own `Field.Root`, so the group owns `name`, `invalid`, and `error`. The control finds out it's in a group from a context in the group's folder (`context.ts`). Props the group owns are ignored on the controls inside it, and their JSDoc says so. A control that only exists inside a group (Radio, in RadioGroup) needs no context: it leaves the group's props out of its type instead, so passing them doesn't compile. Using it outside its group still compiles; it visibly does nothing, which doesn't meet the bar for a dev warning. A disabled group dims only its controls, never its legend or description: axe can tie a disabled control's own label to it and skip its contrast check, but not a group's legend, so a dimmed legend fails `a11y.test`.
- The label: a choice control wraps its label, so the label is `children` (the whole row is the click target). A text field has its label above and can't have children, so the label is a `label` prop. Either way:
- A control needs an accessible name. The props type requires visible label content or an `aria-label`. Type the label as `Exclude<ReactNode, undefined | null | boolean>`, because plain `ReactNode` accepts `undefined` and lets a nameless control compile. Give the label and `aria-label` JSDoc in both branches of that union, so Storybook's docs table describes them.
- Take `invalid` and `error` as separate props. An error is always words plus an icon, never only a red border.
- The description goes under a choice control's label, but between a text field's label and the field, so it's read before typing and phone keyboards and autofill menus can't cover it. The error goes between the label (and description) and the control, for the same reasons, and `FieldError` starts it with a visually hidden "Error:" so screen readers can tell it from the description. A single checkbox or switch has its label beside it, not above, so its error goes above the whole row.
- A control built on `<select>` (NativeSelect) takes its options as an `options` array of `{ value, label }` and groups, not as children: an `<option>` can only show text, and the component can then check the value against them. Group controls (RadioGroup, CheckboxGroup, SegmentedControl) keep taking their options as children.
- Base UI has no textarea, so TextArea renders `Field.Control` as one (`render={<textarea rows={rows} />}`). NativeSelect renders a `<select>` the same way, with only its `<option>`s on the `render` element. `Field.Control`'s props are typed for an `<input>`, so a component like this builds its props type from its own element's attributes (`TextareaHTMLAttributes`), so input-only attributes such as `type` don't compile, and still spreads every prop onto `Field.Control` (with a cast), which passes them on to the element. Only attributes `Field.Control` can't take, such as `rows`, go on the `render` element. Props on the `render` element override Base UI's own, so a consumer's `aria-describedby` there would cut the field's description and error out of it.
- SegmentedControl keeps each Base UI Radio a `<span>`, as Radio does, and draws it as a button. Don't render it as a native `<button>` (`nativeButton`): Base UI always makes the chosen option the Tab stop, and a disabled button can't take focus, so a chosen, disabled option would hide the whole control from Tab. Wrap each option in `Field.Item`: without it, every option inside the `Field.Root` gets the same id.
- An `<input>` can't have pseudo-elements, so a text field can't borrow the invisible hit area. Text fields come in sizes that are already at least `--target-min` tall (`md`, `lg`, which follow `--control-md` and `--control-lg`), never smaller.
- A text field's visible box is the `<input>` itself. Decorative icons sit over it with `pointer-events: none`, so a click anywhere in the box focuses the field.
- A choice control's label wraps it, so clicking the text works. Each row is `--choice-row` tall (32px with a mouse, 44px on touch, never less than `--target-min`), and a choice control with no visible label gets a pseudo-element hit area of `--target-min`. A text field's `<label for>` focuses it.
- Style state from ARIA attributes where they exist (`aria-checked`, `aria-invalid`, `aria-readonly`). ARIA has no read-only state for a radio (only its group has `aria-readonly`), so a radio styles read-only from Base UI's `data-readonly`. Otherwise, choice controls (a `<span>` with a role) use Base UI's `data-disabled`, as `checkbox.css` does, and text fields use the native `:disabled` and `[readonly]`, which a real `<input>` has.
- A hover rule must not cover up a state. `:hover` adds specificity, so exclude the states it would override (`:hover:not(:disabled, [readonly], [aria-invalid="true"])`), or a hovered invalid field loses its red edge.
- Disabled dims the control and its label to 50% opacity; forced colors resets it to full. Read-only dims nothing: the shared `ReadOnlyNote` (`src/internal/`) puts "Read only" and a lock at the end of the visible label, `aria-hidden` because screen readers already announce read-only, so it's also left out of the control's name. A group shows it in its legend and its options don't repeat it; an option that's read-only on its own in a group that isn't shows its own. No note when the control is also disabled, or has no visible label. A read-only text field also hides its placeholder, which has nothing to suggest when you can't type and could be mistaken for a value. The exception is NativeSelect, which has no `readOnly` yet: browsers ignore `readonly` on a `<select>`, and screen readers aren't told (see `docs/revisit.md`). Its type leaves `readOnly` out, and it's dropped if passed anyway.
- Declare each Base UI prop you want in Storybook's docs table explicitly on the component's props type, with JSDoc. Storybook doesn't read props inherited from `node_modules`.
- In tests, check names and descriptions with `toHaveAccessibleName` and `toHaveAccessibleDescription`, and check what the form submits with `FormData`.

## Dev warnings

`warn()` and `warnIfUnnamed()` in `src/internal/warn.ts` print a console warning in development, once per message, prefixed `[design-system] <Component>:`. A consumer's production build replaces `process.env.NODE_ENV` and drops them. Add one only when all three hold:

1. TypeScript can't catch it. If a type can enforce it, use the type.
2. The result is definitely broken: wrong form data, a control with no accessible name, or a prop that silently does nothing. Never for unusual but valid use, style, or preferences.
3. Nothing else would show it: the page doesn't visibly break, and axe in Storybook doesn't catch it.

The message says what's wrong and how to fix it. Warn about values that would have an effect (`invalid` on a group's option warns; `invalid={false}` doesn't). Call them during render, so they also show when a page is rendered on the server. Every form control and button calls `warnIfUnnamed()`, because an empty-string label passes the props type.

`tests/setup.ts` fails any unit test that leaves a `console.warn` behind. A test that expects a warning takes it with `takeWarnings()` from `tests/warnings.ts` and asserts the exact message. Each warning has a test that it fires; correct usage everywhere else proves it stays quiet.

## Pull requests

- Work on a branch and open a pull request into `main`. See `CONTRIBUTING.md` for the workflow, the required checks, and how to review.
- Fill in `.github/pull_request_template.md` honestly. Never tick a checklist item that isn't true, and say what you did not check.
- Chromatic runs on pushes to `main` only, not on pull requests, and snapshots only the stories a change affects (`--only-changed`), to save snapshots. Its visual diff shows up after merging. Don't add screenshots to a pull request; add a recording only for motion or multi-step interactions.
- Chromatic's check passes even when snapshots changed. New and changed stories wait as "must be accepted as baselines" in Chromatic's web app until someone accepts them, so check the build there after a push to `main`.
- Keep a pull request to one thing, and call out breaking changes (renamed or removed props, tokens, or exports).
- One session per folder. Run parallel Claude sessions in their own worktrees (`claude -w <name>`, which creates `.claude/worktrees/<name>/`; git ignores the folder). Switch branches only in a folder no other session is using. Each worktree needs its own `pnpm install`.

## Experiments

`src/experiments/` holds ideas being tried out (the focus sheen, LookAt, a custom cursor, Spin, Bounce, Connections, Magnets), one folder each, shown under Experiments in Storybook.

- Experiments don't have to follow this file's rules or the established patterns: tokens only, tests, stories per state, JSDoc, and so on are all optional there, until an experiment moves out.
- Two rules still hold. An experiment never changes a component, `src/styles/`, or the tokens: it imports its own CSS, and reaches components from outside (FocusSheen styles the components inside its wrapper by their classes). And nothing outside `src/experiments/` imports from it, so it's never exported from `src/index.ts` or published (`tsconfig.build.json` excludes the folder). The one exception is `src/how-it-works/sources.ts`, which reads every experiment's source as text for the How it works pages.
- The checks still run on it: `pnpm typecheck` and `pnpm test` include it, so keep it compiling and its tests passing. `pnpm check` doesn't look at it.
- Work that stays inside `src/experiments/` can go straight to `main`, including experiments that use or affect each other. Anything that would change code outside the folder (a component, `src/internal/`, the styles, or the tokens) goes on its own branch.
- To graduate, an experiment leaves the folder and is rebuilt to follow every rule here, like a new component (`/new-component`).
- `src/experiments/Revisit/` holds comparison stories for open questions in `docs/revisit.md`, shown under Revisit in Storybook: the options side by side in all three themes, drawn by restyling the real components from outside (`Compare.tsx` lays them out). They must still pass axe. When the question is decided, delete its story with its entry.

## How it works pages

Every component and experiment has a "How it works" page, `HowItWorks.mdx` beside its stories (`<Meta of={Stories} name="How it works" />`), that walks through its real code in the order it runs, for people who use the system and want to know what's underneath.

- Show code with `<Code file="components/Switch/Switch.tsx" name="Switch" />` from `src/how-it-works/Code.tsx`. The path is from `src`. `name` is a top-level declaration (function, constant, interface, type, or class), or in a CSS file a rule by how its selector list or at-rule starts (`name=".switch__thumb"`, `name="@media (forced-colors: active)"`). The first rule that starts that way wins, so name more of the list (`name=".a, .b"`) to pick a later one, and use single quotes around a selector with double quotes in it. Leave `name` out for the whole file. The code is read from the file when the page loads, so it can't go out of date, and `src/how-it-works/sources.test.ts` fails if any `<Code>` on any page stops finding its code. Write each `<Code … />` on one line.
- Show what a component renders with `<Inspect>`: the real component, and under it its live HTML, marking each attribute as it changes.
- Demos call the real code. Shared pieces (`Slider`, the `.explain` panel, chart styles) are in `src/how-it-works/demo.tsx` and `demo.css`. A component's own demos go in `src/how-it-works/components/<Name>.tsx`, never in the component's folder, which is published and checked by `pnpm check`. An experiment's go in its folder as `explain.tsx`.
- MDX: Markdown tables don't render, so use HTML `<table>`. Wrap demos in `<Unstyled>`.
- Follow the writing style below, and explain every term the first time it's used.

## Foundations pages

- Each page in `src/foundations/` renders a `docs/brand/*.md` file with Storybook's `Markdown` block, then adds visual blocks from `src/foundations/blocks.tsx`.
- Blocks read `tokens/tokens.json` directly, so new tokens appear automatically. Don't hard-code token values in them.
- Wrap blocks in `<Unstyled>` so Storybook's docs styles don't override them. Each block has its own Light / Dark / Hot dog switch.
- To add a page: write `docs/brand/<topic>.md`, add `src/foundations/NN-<topic>.mdx`, and add its title to `storySort` in `.storybook/preview.tsx`.
- Guidance for one component goes in `docs/brand/<topic>.md` too, rendered by an MDX page attached to the component (`src/components/Button/Button.mdx` renders `buttons.md` as Button's "Choosing a button" page).
- `Resources/Reading list` (`13-reading-list.mdx`, `ReadingList.tsx`) is a searchable page of `docs/reading-list.json`. Add a link once, in the JSON, with its topics and system; then run `pnpm reading-list`. `pnpm check` fails when the generated Markdown or HTML is out of date, which includes after a token change, since the standalone page inlines `tokens.css`. The standalone page's script (`scripts/reading-list-page.js`) and `ReadingList.tsx` filter the same way; change both together.
- `docs/brand/industry.md` compares the system with Apple, Material, Primer, Atlassian, Carbon, Fluent, Polaris, GOV.UK, USWDS, and WCAG. When a choice on a compared topic changes, update its row there.

## Writing style

Applies to docs, JSDoc, story descriptions, README text, and any copy in components:

- Always use the Oxford comma.
- Sentence case for headings, buttons, and labels.
- Short, plain sentences. Buttons say exactly what happens ("Send message").
- No periods in buttons, labels, and headings. Descriptions, hints, errors, and other text that reads as a sentence end with one.
- No emoji in UI or docs.

## Don't

- Edit generated CSS instead of `tokens/tokens.json`.
- Use hex colors, primitive tokens in components, brand tokens (`brand`, `surface-tint`, `link`, `highlight`) in components, or Tailwind for styling.
- Add modifier classes or `cva`.
- Remove a focus outline without replacing it.
- Delete, skip, weaken, or comment out a test to get something passing. Tests are only removed when the user explicitly says so.
- Ship a component without a test file.
- Upgrade TypeScript to 7 or change the pnpm version without checking that every command still passes.
- Commit secrets. The Chromatic token lives in the repo's GitHub secrets as `CHROMATIC_PROJECT_TOKEN`.
