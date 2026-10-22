---
name: new-component
description: Build a new design-system component start to finish (research, an API proposal for approval, tests first, implementation, stories, checks, screenshots, and an independent review), following CLAUDE.md. Use when the user asks for a new component.
argument-hint: "[ComponentName]"
disable-model-invocation: true
---

# New component

Build the component the user named (`$0`) following `CLAUDE.md`. That file is the rulebook; this skill is the order of work. If they ever disagree, `CLAUDE.md` wins, and say so in the final report.

If `$0` is empty, ask which component to build and stop.

**Normalize the name first.** Whatever casing the user typed, the component name is PascalCase (`switch` → `Switch`, `radio group` → `RadioGroup`). Below, `<Name>` means that PascalCase name and `<name>` means its kebab-case form (`Switch` → `switch`, `RadioGroup` → `radio-group`). Files: `src/components/<Name>/<Name>.tsx`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`, and `<name>.css`; classes: `.<name>`, `.<name>__part`.

Work through the phases in order. **Phase 2 ends in a hard stop for the user's approval.** Don't write component files before it.

**An experiment built to these rules.** When the user asks for an experiment in `src/experiments/<Name>/` to follow this skill anyway, every phase applies, with these differences, because an experiment never changes components, styles, or tokens and is never published: no `index.ts`, no export from `src/index.ts`, and no import in `src/styles/index.css` (the component imports its own CSS); no new tokens and no `tokens/contrast.json` pairs, so any color it needs is written in its CSS with a comment saying it becomes a token if the experiment graduates, and its contrast is checked by a `play` function on the `AllThemes` story (`pnpm check` doesn't look at experiments); new dependencies go in `devDependencies`; the story title is `Experiments/<Name>`, so screenshot ids start `experiments-<name>--`; and Phase 9 points the reviewer at `src/experiments/<Name>/`, naming the reference component.

## Phase 1: Research

Before anything else, check the starting point: the branch is based on the latest `main` (`git log -1 main` against the branch's base), and any dependency you've added is still in `node_modules`. Another session can share this folder and switch branches or reinstall packages under you. If one does, suggest a git worktree for one of them.

1. Read `CLAUDE.md` in full, plus `docs/brand/accessibility.md`, `docs/brand/building.md`, `docs/brand/motion.md`, `docs/brand/platforms.md` (sizes with a mouse, on touch, and in compact density), `docs/brand/iconography.md`, and `docs/brand/voice.md`. For a form control, also `docs/brand/forms.md`. Check `docs/brand/industry.md` for a section on this kind of component, and see how the major systems it compares (Primer, Carbon, Atlassian, Material, Fluent, Polaris, GOV.UK, and others) name it, which variants they offer, and where they disagree.
2. Pick the reference component: `src/components/Checkbox/` for choice controls (checkboxes, switches, radios), `src/components/Input/` for text fields, and `src/components/Button/` for actions. Read all its files. New components match its structure, prop names, JSDoc style, and test layout unless there is a reason not to.
3. Look for the component in Base UI (the files in `node_modules/@base-ui/react/docs/react/components/`) and in shadcn/ui (the component list at https://ui.shadcn.com/docs/components). If Base UI has a matching primitive, read its docs at `node_modules/@base-ui/react/docs/react/components/<name>.md`. They ship with the installed version and are authoritative. shadcn's version is a reference for structure only.
   If neither has a component by that name (a segmented control, for example), don't pick the closest one quietly. Find the Base UI primitives it could be built on, and for each one note what it's for, what a screen reader announces, its keyboard behavior, and what it gives up (no form `name`, letting nothing be selected, and so on). The choice usually depends on what the component is for, so it goes to the user in Phase 2. Research each candidate in the steps below.
4. Render the primitive in a throwaway test to see the exact DOM, ARIA, and `data-*` attributes it emits, with every state you'll style turned on (inside `Field.Root` for form controls):

   ```sh
   mkdir -p src/scratch   # write src/scratch/proto.test.tsx that renders it and console.logs container.innerHTML
   pnpm exec vitest run --project unit src/scratch/proto.test.tsx --silent=false
   rm -rf src/scratch
   ```

   Style from what it actually emits, not from memory.

5. In the same throwaway test, record the keyboard behavior: focus the control and press Space, Enter, and any keys its pattern uses (arrows, Home, End, Escape), and log what changes. Similar Base UI primitives behave differently (Enter toggles a Switch but not a Checkbox), so don't assume it from the reference component.
   For a control that is one Tab stop (a radio group, a segmented control, tabs), also press Tab with the chosen item disabled, and with the whole control disabled. Base UI makes the chosen item the Tab stop, so if that item can't take focus (a disabled native `<button>`), Tab skips the whole control.

6. If the new component contains or wraps an existing one (a group of Checkboxes, a field around an Input), render them together in the throwaway test, not only the bare primitive. The existing component may bring its own Base UI wrappers that break the composition: Checkbox's own `Field.Root` hid a CheckboxGroup's `name`, so the form submitted nothing. Note any change the existing component needs; it goes in the proposal.

7. For a control with a single value (a radio group, a select), check how a controlled one says "nothing selected" (Base UI's RadioGroup takes `null`; `undefined` makes it uncontrolled), and type `value` so it can.

8. If Base UI has no matching primitive and the component renders a Base UI part as a different element through `render` (TextArea renders `Field.Control` as a `<textarea>`), pass every prop through the Base UI part, not the `render` element. Props on the `render` element override Base UI's own, so a consumer's `aria-describedby` there replaced the field's links to its description and error. Put only attributes the Base UI part can't take (such as `rows`) on the `render` element.

## Phase 2: Design proposal (stop for approval)

Present this to the user and **stop**. Keep it to what they need to decide.

- **What it is and when to use it**, in one or two sentences, and what it should not be used for.
- **Built on:** the Base UI primitive and parts, and the reference component it follows. If Base UI and shadcn have no component by that name, say so first. Then list the candidates from Phase 1 in a table (what each is for, what a screen reader announces, what it gives up), recommend one, and make the choice the first open question.
- **Props table:** name, type, default, what it maps to (`data-*` attribute, ARIA attribute, or Base UI prop). Mark anything that differs from the reference component and why.
- **Anatomy:** the elements and their classes (`.name`, `.name__part`).
- **States and how each is styled:** which ARIA or `data-*` attribute drives it.
- **Keyboard behavior** as recorded in Phase 1, and any place it differs from the reference component.
- **Sizes:** its height and hit area with a mouse, on touch, and under compact density, from the size tokens. Anything smaller than `--target-min` in any mode needs a pseudo-element hit area; a text field can't have one, so it must never be shorter.
- **How other systems do it:** a short table of what the major systems call it, the variants they offer, and where they differ, with what we chose. It becomes a section or row in `docs/brand/industry.md` in Phase 8.
- **When to use each variant**, if it has variants or could be confused with another component (a segmented control or tabs, a switch or a checkbox). It becomes a guidance page in Phase 8.
- **Tokens:** existing tokens it uses, and any new token it needs (name, value, usage note).
- **Color pairs** it introduces, to add to `tokens/contrast.json`.
- **Motion:** what moves, with which tokens.
- **Hot dog and forced-colors treatment.**
- **Open questions:** decisions that are the user's, each with a recommendation.

Offer to have the `junior-engineer` agent (Agent tool, `subagent_type: junior-engineer`) read it before the user's final pass. Give it the proposal text, the repo root, and the revision, and nothing about how you reached the design. Relay its blocking questions with your answer to each, and fold the answers into the proposal.

Then ask for approval or changes. Continue only after the user approves. If they change the design, update the proposal and confirm again.

## Phase 3: Tests first

1. Write the props type (and a stub component that renders `null`) in `<Name>.tsx`, so the test file typechecks.
2. Write `<Name>.test.tsx` from the approved API, covering the full list in the Testing section of `CLAUDE.md`. Include `expectTypeOf` checks for any rule enforced in types.
   Behavior that depends on CSS or layout (clicks passing through an icon, hit areas, anything relying on `pointer-events`, sizes, or position) can't be tested in jsdom. Plan every size and hit-area check to run with a mouse and again on touch (`data-pointer="coarse"`), as CLAUDE.md's Testing section describes: with a mouse `--target-min` is only 24px, so a check that only runs there misses a broken touch hit area. For any control that can have no visible label, plan a story check that its wrapper is at least `--target-min` tall: its hit area hides the gap in a story with one control, but stacked unlabelled controls otherwise steal each other's clicks. Don't put it in the unit tests; list it now and write it as a story `play` function in Phase 5, for example a real hit-test with `document.elementFromPoint`.
   For a form control, test that a consumer's `aria-describedby` is added to the description and error, not put in their place: the control's accessible description must still include both. The usual "passes other props through" test only checks plain attributes, so it can't catch this.
   Base UI popups (Popover, Dialog, Menu, Select, Tooltip) move focus a frame after they open or close, so check focus after opening or closing one with `await waitFor(() => expect(...).toHaveFocus())`, not straight away.
3. Run `pnpm test:unit` and `pnpm typecheck`. Every runtime test should fail, because the stub renders nothing; none should fail from import or type errors. Note the count.
4. List the tests that pass against the stub (`pnpm exec vitest run --project unit src/components/<Name> --reporter=verbose`). Type-only tests (`expectTypeOf`) pass at runtime by design; `pnpm typecheck` checks them. **Any other test that passes is vacuous**: it only asserts that something is absent, so an empty render satisfies it. Make it stricter by asserting a positive precondition first (the control or hidden input exists), and rerun until only type tests pass.

## Phase 4: Implement

1. Add any new token to `tokens/tokens.json` with a usage note, then `pnpm tokens`. Never edit generated CSS.
2. Write `<Name>.tsx` (JSDoc on the component and every prop) and `<name>.css` (in `@layer components`).
3. Add `index.ts`, export from `src/index.ts`, and import the CSS in `src/styles/index.css`.
4. Add every new color pair to `tokens/contrast.json`.
5. Make the tests pass by fixing the component. **Never delete, skip, weaken, or comment out a test.** If a test looks wrong, work out whether the component or the test is at fault. A test with a real bug (such as a focus assumption broken by an earlier click) may be fixed in a way that checks the same behavior at least as strictly; say so in the final report. If you think the expected behavior itself is wrong, stop and ask the user. The test-removal hook will flag removed tests or assertions.

## Phase 5: Stories

Write `<Name>.stories.tsx`: a `Playground` with controls; a `States` story showing every state side by side (Phase 7's focus check opens it, and the first Tab must land in it); one story per variant group or state; and `AllThemes` with every state in all three themes. Keep `play` functions to short demos, plus the CSS-dependent checks listed in Phase 3, each run with a mouse and on touch. Labels, descriptions, and errors in stories are real copy: follow `docs/brand/voice.md` (no periods in labels and buttons; errors say what went wrong and how to fix it).

## Phase 6: Verify

Run all of these and fix what they report:

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm build-storybook
pnpm check:tests
```

Then prove the tests can fail: break the component three ways that matter (for example, a state no longer reaching an ARIA attribute, a decorative icon losing `aria-hidden`, the label no longer naming the control). Back up the file first with `cp`, break it, run `pnpm test:unit`, and restore it from the backup with `cp`. **Don't use `git checkout` to restore**: the component is uncommitted, and that would discard it. Confirm with `diff` that the restored file matches the backup. Each break must make at least one test fail; if one doesn't, add the missing test.

## Phase 7: Look at it

Screenshot the `AllThemes` story in all three themes with the recipe under "Looking at a component" in `CLAUDE.md`, saving to the scratchpad directory, and open each image with the Read tool. Check alignment, every state, focus, hot dog mode, and dark mode. In a worktree, use a port other than 6107, so another session's screenshots don't collide with yours.

Then screenshot the light theme again with `data-pointer="coarse"` and with `data-density="compact"` set on the section (`page.locator('section[data-theme=light]').evaluate((el) => el.dataset.pointer = 'coarse')`). Check that it grows or shrinks with the tokens, that icons and labels stay centered, and that nothing overlaps.

For a text field, type a value into the fields before screenshotting, so browser-drawn pieces show up: search clear buttons, autofill colors, number spinners, and password reveal buttons. Each must be themed, hidden, or a deliberate choice written down.

If the component renders lists (`ul`, `ol`), check their bullets and numbers show: the base styles remove them. For any story that isn't `fullscreen`, Storybook centers the component on the page, so screenshot the `#storybook-root` element or the whole page, not a fixed area.

Then check what the theme screenshots can't show, with the second recipe there: a focused control (if the story has a `play` function, it has already run when the page loads and may have moved focus, so don't press Tab again before screenshotting), the `AllThemes` story with forced colors emulated, and hover. **For every state that changes an edge or a fill (checked, selected, invalid, and so on), compare the computed style at rest and while hovered, in normal mode and in forced colors.** Hover must never cover up a state: a hovered "on" Switch once lost its fill and hid its thumb in forced colors, and a hovered invalid Input once lost its red edge. Use real hover through Playwright (`locator.hover()`); a story's `userEvent.hover` doesn't trigger CSS `:hover`.

In forced colors, also check every state **at rest**: its edge or fill must differ from the page color. A state rule outranks the forced-colors base rule, and the browser can then draw it in the page color. An invalid, unticked Checkbox once disappeared entirely this way, with no hover involved. Look at the forced-colors screenshot for missing boxes, and log `borderTopColor` and `backgroundColor` for each state next to the page's `Canvas`. Read every label in that screenshot too: the browser draws a Canvas backplate behind text, which hides `HighlightText` on a `Highlight` fill even when the logged colors look right (a chosen segment's label vanished this way; `forced-color-adjust: none` fixes it).

When a rule that dims or colors a state gains extra conditions (`:not(:focus-visible)`, `:has(...)`), copy the same selector into the forced-colors reset. Otherwise the reset is less specific and loses: disabled segments stayed faded in forced colors this way.

If the `AllThemes` matrix lays components out in columns, check that each one keeps its own height when its grid cell is stretched by a taller neighbor. A component whose root is a grid spreads its rows apart unless it sets `align-content: start`.

If any part is dimmed with `opacity` (read-only, for example), check the contrast of everything inside it at that opacity, placeholders and icons included. If a dimmed control can still receive focus (a disabled radio group's selected radio), its focus outline is dimmed too: check it still meets 3:1, or restore full opacity on `:focus-visible`. `pnpm check:contrast` only knows undimmed pairs, so compute the composited colors by hand (blend each color with the page color at the opacity) and check 4.5:1 for text and 3:1 for edges and meaningful icons.

Fix what looks wrong and check again.

## Phase 8: Docs

If the component introduces a new pattern or rule, add it to `CLAUDE.md` (code rules) or the right `docs/brand/` page (design rules). Don't restate what's already there.

If the proposal had a "When to use each variant" section, write it as a guidance page, `docs/brand/<topic>.md`, and render it with `src/components/<Name>/<Name>.mdx` beside the stories (`buttons.md` and `Button.mdx` are the pattern). Add the "How other systems do it" table to `docs/brand/industry.md`, with sources.

## Phase 9: Independent review

This runs automatically as part of this skill; the user doesn't start it. Spawn the `component-reviewer` subagent (Agent tool, `subagent_type: component-reviewer`) with the prompt: "Review the component `<Name>` in `src/components/<Name>/`. Follow your instructions and return the report in the exact shape they give." If that agent type isn't available, spawn a general-purpose agent and tell it to read and follow `.claude/agents/component-reviewer.md` exactly. Wait for the report. Don't summarize your own reasoning or decisions to it; it should judge only the repo.

Fix every Must fix, then rerun Phase 6's commands. For Should fix and Consider items, fix the clear ones and list the rest for the user with your recommendation.

If the review finds the same bug in the reference component (or any other existing component), fix it there too, with a test where one can catch it, and keep that fix in its own commit. Removing a test, even a redundant one, still needs the user's approval.

## Phase 10: Report and stop

Tell the user:

- What was built, and the test count.
- Decisions made, and anything to revisit.
- What the review found and what you changed.
- Anything you couldn't verify.
- **Improvements to this skill:** anything in these phases that was wrong, missing, out of order, or slowed you down, with a proposed edit to `.claude/skills/new-component/SKILL.md`.

Then ask whether to commit. **Don't commit or push unless the user says to.** When they do, split commits by topic: fixes to existing components first, then the new component, then any changes to this skill or the reviewer.

Edits to this skill take effect in the next run only after the user runs `/reload-skills`, so say so when you change it.
