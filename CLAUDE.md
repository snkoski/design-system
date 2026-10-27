# CLAUDE.md

Instructions for working in this repo. Read this before changing anything.

## What this is

A standalone design system: tokens, CSS, and React components, published as a package that other projects (Astro sites, React apps, possibly in other GitHub orgs) install. The current palette is called Sherbet (tangerine, peach, and mint with espresso ink). It has three themes: `light`, `dark`, and `hotdog` (a deliberate joke theme in ketchup and mustard that still has to pass every accessibility check).

The brand book (principles, voice, color usage, type, layout, motion, iconography, accessibility, and building rules) lives in `docs/brand/*.md`. **This repo is the source of truth.** Storybook's Foundations pages render those files, plus visual blocks drawn from `tokens/tokens.json`. The design system artifact on claude.ai is a copy that gets re-synced from the repo; never treat it as the source.

When a rule or guideline changes, update the matching file in `docs/brand/`. If it's a rule about how code is written, update this file too.

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
pnpm check            # contrast of every color pair in all themes, and the rules in this file (CSS, structure)
pnpm check:tests      # fails if tests were deleted, skipped, or weakened compared with HEAD (or --base <ref>)
pnpm tokens           # regenerate CSS from tokens/tokens.json (the other scripts do this first)
```

Before saying any change is done, run `pnpm typecheck`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm build-storybook`, and fix anything they report. `pnpm typecheck` also checks the type-level assertions (`expectTypeOf`) in test files.

## Layout

```
tokens/tokens.json           single source for colors, sizes, type, spacing, radii, and shadows
scripts/build-tokens.mjs     generates src/styles/tokens.css and src/styles/tailwind-theme.css
scripts/copy-css.mjs         writes the published CSS into dist/
src/styles/                  index.css (layer order and imports), base.css, fonts.css, generated CSS
src/components/<Name>/       Name.tsx, name.css, Name.test.tsx, Name.stories.tsx, index.ts
src/internal/                pieces several components share (cx, FieldError and field-error.css, warn), with tests.
                             Not exported from the package.
tests/setup.ts               setup for the unit tests (jest-dom matchers, cleanup, fail on unexpected warnings)
tests/warnings.ts            takeWarnings(), for tests that expect a dev warning
tokens/contrast.json         every foreground and background color pair the components use, with its minimum ratio
scripts/check-*.mjs          pnpm check (contrast, rules) and pnpm check:tests
.claude/settings.json        a hook that warns when tests are removed, skipped, or weakened
vitest.config.ts             two projects: `unit` (jsdom) and `storybook` (Chromium)
docs/brand/                  the brand book, one Markdown file per topic
docs/revisit.md              decisions to come back to, and open questions
docs/reading-list.md         articles and references to read later, by topic
src/experiments/             ideas being tried out; relaxed rules, never published (see Experiments)
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

## Accessibility (requirements, not suggestions)

- Text meets 4.5:1 contrast in every theme (3:1 for 24px+ or bold 19px+). Control borders, focus rings, and meaningful icons meet 3:1. Check all three themes, including hot dog.
- Color never carries meaning alone: add an icon, a word, or a shape.
- Focus is an **outline**, never only a box-shadow: `outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset);`.
- Every control has a border, `transparent` if the design doesn't want one visible, so it shows in Windows forced-colors mode. Connected options (a segmented control's) share one: the track's edge and the lines between options. Selected and checked states never rely on background color alone. Icons use `currentColor`. Add a `@media (forced-colors: active)` block when something would disappear. Text on a `Highlight` fill (a chosen segment) needs `forced-color-adjust: none` there, or the browser's Canvas backplate behind the text hides it. Hover rules are usually more specific than the forced-colors overrides and win, so repeat the hover selectors for checked or selected states inside that block (a hovered "on" switch otherwise loses its fill and hides the thumb).
- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for inputs. A link that looks like a button is still an `<a>` (see `ButtonLink`). Don't pass `<a>` to a Base UI component's `render` prop.
- Interactive components (dialog, menu, tabs, select, tooltip, popover, and so on) are built on Base UI. Never hand-roll their keyboard handling, focus management, or ARIA.
- Every interactive target's hit area is at least `--target-min` in both directions: 24px with a mouse (WCAG 2.2 AA) and 44px when a touch screen is present. When the visible control is smaller, extend it with an invisible pseudo-element (see `.button::after`). The one exception is the resize handle the browser draws on a text area (see `docs/brand/accessibility.md`). Separate small targets are at least `--target-gap` (8px) apart.
- Focus must never be hidden behind sticky headers or footers (use `scroll-padding`). Anything done by dragging also works with a tap or click.
- Icon-only controls require an accessible name; enforce it in the props type.
- Storybook runs axe on every story with `a11y.test: "error"`. A violation is a bug, not something to suppress.

## Motion

- Durations 100–320ms using the motion tokens. Exits are faster than entrances and use `--ease-in`.
- Animate only `transform` and `opacity`.
- Slides and shifts use `--motion-distance` and pops use `--motion-scale`. Looping animations (spinner, skeleton) use `--duration-loop`, which gets slower under reduced motion. Under `prefers-reduced-motion` slides and pops become `0` and `1`, so movement turns into fades without component changes. Never write a separate reduced-motion rule when a token can do it.
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
- Validate on submit, then on leaving a field. Never disable the submit button to signal an incomplete form.
- Errors in words next to the field, with `aria-invalid` and `aria-describedby`. An error summary at the top for two or more errors, focused on submit.
- Buttons start with a verb, have no punctuation, and say exactly what happens. Error messages say what went wrong and how to fix it, with no blame, jokes, "invalid," or "oops."

## Themes

- Set with `data-theme="light" | "dark" | "hotdog"` on `<html>`. With no attribute, light or dark follows `prefers-color-scheme`.
- Hot dog mode uses hard offset shadows and `border-thick` ink outlines; components you click (buttons, checkboxes, switches) press into their shadow on `:active`. Text fields don't press: you type in them, so they keep their shadow. A segmented control's options don't press either: the shadow belongs to the whole track.

## Adding a component

1. If Base UI has a matching primitive, build on it. shadcn's version is a good reference for structure; replace its Tailwind styling with a CSS file that follows the rules above.
   Read Base UI's docs for it first: `node_modules/@base-ui/react/docs/react/components/<name>.md` ships with the package and is authoritative. Before writing CSS, render the primitive in a throwaway Vitest test and print the DOM, to see exactly which ARIA and `data-*` attributes it sets (Checkbox's `aria-checked="mixed"`, `aria-invalid`, and `data-disabled` came from this). Delete the throwaway test afterwards.
2. Create `src/components/<Name>/` with `Name.tsx`, `name.css`, `Name.test.tsx`, `Name.stories.tsx`, and `index.ts`.
   Write the test file for every component; it is not optional (see Testing).
   A closely related sibling that shares the folder's CSS (such as `ButtonLink` next to `Button`) gets its own `.tsx`, test file, and stories, and any code the two share goes in `shared.tsx`. Everything else gets its own folder.
3. Write JSDoc on the component and every prop. It becomes the Storybook docs.
4. Import the CSS in `src/styles/index.css` and export the component and its types from `src/index.ts`.
5. Stories: a `Playground` with controls, a `States` story with every state side by side, one story per variant group and state, and an `AllThemes` story that renders every variant and state in all three themes side by side (Chromatic snapshots it). Checks of sizes and hit areas run with a mouse and on touch (see Testing). Labels, descriptions, and errors in stories follow `docs/brand/voice.md`, like real copy.
6. Interaction tests in stories use the `canvas` and `userEvent` passed into `play`, not `within`, `screen`, or an imported `userEvent`.
7. Add any new foreground and background color pair to `tokens/contrast.json`, check focus in all three themes, then run typecheck, check, test, build, and build-storybook.
8. Look at it. Passing tests don't show whether it looks right. Build Storybook and screenshot the `AllThemes` story in each theme (recipe under "Looking at a component"), then check alignment, every state, and hot dog mode by eye. Also look at it with `data-pointer="coarse"` and inside `data-density="compact"`.
9. If the component introduces a new rule or pattern, add it to the right page in `docs/brand/`. If people need help deciding when to use it or which variant to pick, write a guidance page, `docs/brand/<topic>.md`, rendered by a `<Name>.mdx` beside the stories (see `buttons.md` and `Button.mdx`). If the major design systems handle it differently, add a section or row to `docs/brand/industry.md` with what Sherbet chose.

### Looking at a component

```sh
pnpm build-storybook
python3 -m http.server 6107 -d storybook-static &     # stop it afterwards: pkill -f "http.server 6107"
node --input-type=module -e "
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
for (const theme of ['light', 'dark', 'hotdog']) {
  await page.goto('http://localhost:6107/iframe.html?id=components-<name>--all-themes&viewMode=story');
  await page.waitForSelector('[data-theme=' + theme + ']');
  await page.locator('section[data-theme=' + theme + ']').screenshot({ path: '<scratchpad>/<name>-' + theme + '.png' });
}
await browser.close();
"
```

Then check what the theme screenshots can't show: focus, forced colors, and hover in forced colors. Same server, a second script:

```sh
node --input-type=module -e "
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
await page.goto('http://localhost:6107/iframe.html?id=components-<name>--states&viewMode=story');
await page.keyboard.press('Tab');
await page.locator('#storybook-root').screenshot({ path: '<scratchpad>/<name>-focus.png' });
await page.emulateMedia({ forcedColors: 'active' });
await page.goto('http://localhost:6107/iframe.html?id=components-<name>--all-themes&viewMode=story');
await page.locator('section[data-theme=light]').screenshot({ path: '<scratchpad>/<name>-forced.png' });
// Repeat for every state that changes an edge or fill: [aria-checked=true], [aria-invalid=true], [aria-selected=true], ...
const on = page.locator('[aria-checked=true]').first();
const look = () => on.evaluate((el) => getComputedStyle(el).backgroundColor + ' ' + getComputedStyle(el).borderTopColor);
const rest = await look(); await on.hover(); await page.waitForTimeout(300);
console.log('at rest', rest, '| hovered', await look());   // hover must not cover up the state; check without forced colors too
await browser.close();
"
```

Run scripts from the repo folder with `node --input-type=module` (piping a file in with `<` works too). A script file saved elsewhere can't find `playwright`. Port 6107 is for this folder: in a worktree, use another port for the server and the URLs, so two sessions' screenshots don't collide.

Story ids are the title and story name in kebab case (`Components/Button link` and `AllThemes` become `components-button-link--all-themes`). Put the screenshots in a scratch folder, not the repo, and open them with the Read tool.

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
- Sizes depend on the pointer, and story tests run with a mouse. There `--target-min` is 24px, smaller than most controls, so a size or hit-area check that only runs with a mouse passes even when the touch hit area is broken. Check both: mouse first, then set `canvasElement.dataset.pointer = "coarse"`, check again inside `try`, and delete it in `finally` (see Radio's `WithoutVisibleLabel`). Measure tokens with a probe element inside `canvasElement`, so `data-pointer` reaches it, rather than hard-coding px, and also assert the floor (`--target-min` at least 24px with a mouse and 44px on touch), so a token mistake can't make the check pass by default.
- Define a story decorator that uses its context argument (`(Story, { parameters }) => …`) as a typed `const` outside `meta`, with the `Decorator` type. Written inline inside `meta`, it breaks Storybook's inference and every story's args become `never`.
- Keep `play` functions in stories short, to show the main interaction. Put exhaustive cases in the test file so nothing is tested twice.
- Anything that listens for an event a `play` function sends straight after rendering (a pointer move, say) subscribes in `useLayoutEffect`, not `useEffect`. In a built Storybook, as on Chromatic, the passive effect runs after the play function has started, so the first event is lost; the dev server's timing hides this. Check those stories in a built Storybook (`pnpm build-storybook`, served as in "Looking at a component"), not only with `pnpm test`. LookAt and LookAtCanvas both hit this.
- When fixing a bug, add the test that would have caught it first.
- Check that a new test can fail: break the code on purpose and confirm the test catches it.
- A test that only asserts something is absent (`not.toBeInTheDocument`, an empty `FormData`, `not.toMatch`) also passes when nothing renders at all. Assert a positive precondition first, such as the control or hidden input existing. Writing tests against a stub that renders `null` exposes these: every runtime test should fail there.
- jest-dom's `toBeRequired` only understands some roles, not `switch`. For those, check `aria-required` and the hidden input's `required` directly, and check that a negative assertion can actually fail.
- A hook in `.claude/settings.json` runs `scripts/check-tests-kept.mjs` after edits to test and story files, and after shell commands that remove them. If it reports removed, skipped, or weakened tests, put them back unless the user explicitly asked for the removal. `pnpm check:tests` runs the same check by hand.

## Form controls

Checkbox is the pattern for choice controls (checkboxes, switches, radios), and Input for text fields (TextArea follows it). SegmentedControl is a RadioGroup drawn as connected buttons. Follow them:

- Wrap the control in Base UI's `Field.Root`, put the label in `Field.Label`, and render the `description` prop with `Field.Description` and the `error` prop with the shared `FieldError` (`src/internal/`), passing the part's own class (`className="checkbox__error"`). `FieldError` draws the icon and the words, so every control's error looks the same; the component's CSS only places it. Base UI then links them with `aria-labelledby`, `aria-describedby`, and `aria-invalid`, so don't set those by hand.
- A group of choice controls (CheckboxGroup is the pattern) is one field: `Field.Root` around a `Fieldset.Root` rendered as Base UI's group, with its label in `Fieldset.Legend`. A control inside a group renders `Field.Item` instead of its own `Field.Root`, so the group owns `name`, `invalid`, and `error`. The control finds out it's in a group from a context in the group's folder (`context.ts`). Props the group owns are ignored on the controls inside it, and their JSDoc says so. A control that only exists inside a group (Radio, in RadioGroup) needs no context: it leaves the group's props out of its type instead, so passing them doesn't compile. Using it outside its group still compiles; it visibly does nothing, which doesn't meet the bar for a dev warning. A disabled or read-only group dims only its controls, never its legend or description: axe can tie a disabled control's own label to it and skip its contrast check, but not a group's legend, so a dimmed legend fails `a11y.test`.
- The label: a choice control wraps its label, so the label is `children` (the whole row is the click target). A text field has its label above and can't have children, so the label is a `label` prop. Either way:
- A control needs an accessible name. The props type requires visible label content or an `aria-label`. Type the label as `Exclude<ReactNode, undefined | null | boolean>`, because plain `ReactNode` accepts `undefined` and lets a nameless control compile. Give the label and `aria-label` JSDoc in both branches of that union, so Storybook's docs table describes them.
- Take `invalid` and `error` as separate props. An error is always words plus an icon, never only a red border.
- The description goes under a choice control's label, but between a text field's label and the field, so it's read before typing and phone keyboards and autofill menus can't cover it. The error goes after the field.
- Base UI has no textarea, so TextArea renders `Field.Control` as one (`render={<textarea rows={rows} />}`). `Field.Control`'s props are typed for an `<input>`, so a component like this builds its props type from its own element's attributes (`TextareaHTMLAttributes`), so input-only attributes such as `type` don't compile, and still spreads every prop onto `Field.Control` (with a cast), which passes them on to the element. Only attributes `Field.Control` can't take, such as `rows`, go on the `render` element. Props on the `render` element override Base UI's own, so a consumer's `aria-describedby` there would cut the field's description and error out of it.
- SegmentedControl keeps each Base UI Radio a `<span>`, as Radio does, and draws it as a button. Don't render it as a native `<button>` (`nativeButton`): Base UI always makes the chosen option the Tab stop, and a disabled button can't take focus, so a chosen, disabled option would hide the whole control from Tab. Wrap each option in `Field.Item`: without it, every option inside the `Field.Root` gets the same id. Its label is inside the fill, so read-only dims only the options that aren't chosen: dimming the chosen one would take its text below 4.5:1.
- An `<input>` can't have pseudo-elements, so a text field can't borrow the invisible hit area. Text fields come in sizes that are already at least `--target-min` tall (`md`, `lg`, which follow `--control-md` and `--control-lg`), never smaller.
- A text field's visible box is the `<input>` itself. Decorative icons sit over it with `pointer-events: none`, so a click anywhere in the box focuses the field.
- A choice control's label wraps it, so clicking the text works. Each row is `--choice-row` tall (32px with a mouse, 44px on touch, never less than `--target-min`), and a choice control with no visible label gets a pseudo-element hit area of `--target-min`. A text field's `<label for>` focuses it.
- Style state from ARIA attributes where they exist (`aria-checked`, `aria-invalid`, `aria-readonly`). ARIA has no read-only state for a radio (only its group has `aria-readonly`), so a radio styles read-only from Base UI's `data-readonly`. Otherwise, choice controls (a `<span>` with a role) use Base UI's `data-disabled`, as `checkbox.css` does, and text fields use the native `:disabled` and `[readonly]`, which a real `<input>` has.
- A hover rule must not cover up a state. `:hover` adds specificity, so exclude the states it would override (`:hover:not(:disabled, [readonly], [aria-invalid="true"])`), or a hovered invalid field loses its red edge.
- Disabled dims the control and its label to 50% opacity. Read-only dims only the control, to 75%, and keeps the label at full strength, because read-only content must stay readable. A read-only text field also hides its placeholder, which would fall below 4.5:1 at 75% and has nothing to suggest when you can't type. At 75% the control's edge and its mark still meet 3:1 in every theme. Forced colors resets both to full opacity.
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
- Chromatic posts the Storybook preview and the visual diff, so don't add screenshots. Add a recording only for motion or multi-step interactions.
- Chromatic's check passes even when snapshots changed. New and changed stories wait as "must be accepted as baselines" in Chromatic's web app until someone accepts them, so check the build there after a push.
- Keep a pull request to one thing, and call out breaking changes (renamed or removed props, tokens, or exports).
- One session per folder. Run parallel Claude sessions in their own worktrees (`claude -w <name>`, which creates `.claude/worktrees/<name>/`; git ignores the folder). Switch branches only in a folder no other session is using. Each worktree needs its own `pnpm install`.

## Experiments

`src/experiments/` holds ideas being tried out (the focus sheen, LookAt, a custom cursor, Spin, Bounce, Connections, Magnets), one folder each, shown under Experiments in Storybook.

- Experiments don't have to follow this file's rules or the established patterns: tokens only, tests, stories per state, JSDoc, and so on are all optional there, until an experiment moves out.
- Two rules still hold. An experiment never changes a component, `src/styles/`, or the tokens: it imports its own CSS, and reaches components from outside (FocusSheen styles the components inside its wrapper by their classes). And nothing outside `src/experiments/` imports from it, so it's never exported from `src/index.ts` or published (`tsconfig.build.json` excludes the folder).
- The checks still run on it: `pnpm typecheck` and `pnpm test` include it, so keep it compiling and its tests passing. `pnpm check` doesn't look at it.
- Work that stays inside `src/experiments/` can go straight to `main`, including experiments that use or affect each other. Anything that would change code outside the folder (a component, `src/internal/`, the styles, or the tokens) goes on its own branch.
- To graduate, an experiment leaves the folder and is rebuilt to follow every rule here, like a new component (`/new-component`).
- `src/experiments/Revisit/` holds comparison stories for open questions in `docs/revisit.md`, shown under Revisit in Storybook: the options side by side in all three themes, drawn by restyling the real components from outside (`Compare.tsx` lays them out). They must still pass axe. When the question is decided, delete its story with its entry.

## Foundations pages

- Each page in `src/foundations/` renders a `docs/brand/*.md` file with Storybook's `Markdown` block, then adds visual blocks from `src/foundations/blocks.tsx`.
- Blocks read `tokens/tokens.json` directly, so new tokens appear automatically. Don't hard-code token values in them.
- Wrap blocks in `<Unstyled>` so Storybook's docs styles don't override them. Each block has its own Light / Dark / Hot dog switch.
- To add a page: write `docs/brand/<topic>.md`, add `src/foundations/NN-<topic>.mdx`, and add its title to `storySort` in `.storybook/preview.tsx`.
- Guidance for one component goes in `docs/brand/<topic>.md` too, rendered by an MDX page attached to the component (`src/components/Button/Button.mdx` renders `buttons.md` as Button's "Choosing a button" page).
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
- Use hex colors, primitive tokens in components, or Tailwind for styling.
- Add modifier classes or `cva`.
- Remove a focus outline without replacing it.
- Delete, skip, weaken, or comment out a test to get something passing. Tests are only removed when the user explicitly says so.
- Ship a component without a test file.
- Upgrade TypeScript to 7 or change the pnpm version without checking that every command still passes.
- Commit secrets. The Chromatic token lives in the repo's GitHub secrets as `CHROMATIC_PROJECT_TOKEN`.
