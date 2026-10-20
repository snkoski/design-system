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

## Phase 1: Research

1. Read `CLAUDE.md` in full, plus `docs/brand/accessibility.md`, `docs/brand/building.md`, and `docs/brand/motion.md`.
2. Pick the reference component: `src/components/Checkbox/` for form controls, `src/components/Button/` for actions. Read all its files. New components match its structure, prop names, JSDoc style, and test layout unless there is a reason not to.
3. If Base UI has a matching primitive, read its docs at `node_modules/@base-ui/react/docs/react/components/<name>.md`. They ship with the installed version and are authoritative.
4. Render the primitive in a throwaway test to see the exact DOM, ARIA, and `data-*` attributes it emits, with every state you'll style turned on (inside `Field.Root` for form controls):

   ```sh
   mkdir -p src/scratch   # write src/scratch/proto.test.tsx that renders it and console.logs container.innerHTML
   pnpm exec vitest run --project unit src/scratch/proto.test.tsx --silent=false
   rm -rf src/scratch
   ```

   Style from what it actually emits, not from memory.

5. In the same throwaway test, record the keyboard behavior: focus the control and press Space, Enter, and any keys its pattern uses (arrows, Home, End, Escape), and log what changes. Similar Base UI primitives behave differently (Enter toggles a Switch but not a Checkbox), so don't assume it from the reference component.

## Phase 2: Design proposal (stop for approval)

Present this to the user and **stop**. Keep it to what they need to decide.

- **What it is and when to use it**, in one or two sentences, and what it should not be used for.
- **Built on:** the Base UI primitive and parts, and the reference component it follows.
- **Props table:** name, type, default, what it maps to (`data-*` attribute, ARIA attribute, or Base UI prop). Mark anything that differs from the reference component and why.
- **Anatomy:** the elements and their classes (`.name`, `.name__part`).
- **States and how each is styled:** which ARIA or `data-*` attribute drives it.
- **Keyboard behavior** as recorded in Phase 1, and any place it differs from the reference component.
- **Tokens:** existing tokens it uses, and any new token it needs (name, value, usage note).
- **Color pairs** it introduces, to add to `tokens/contrast.json`.
- **Motion:** what moves, with which tokens.
- **Hot dog and forced-colors treatment.**
- **Open questions:** decisions that are the user's, each with a recommendation.

Then ask for approval or changes. Continue only after the user approves. If they change the design, update the proposal and confirm again.

## Phase 3: Tests first

1. Write the props type (and a stub component that renders `null`) in `<Name>.tsx`, so the test file typechecks.
2. Write `<Name>.test.tsx` from the approved API, covering the full list in the Testing section of `CLAUDE.md`. Include `expectTypeOf` checks for any rule enforced in types.
   Behavior that depends on CSS or layout (clicks passing through an icon, hit areas, anything relying on `pointer-events`, sizes, or position) can't be tested in jsdom. Don't put it in the unit tests; list it now and write it as a story `play` function in Phase 5, for example a real hit-test with `document.elementFromPoint`.
3. Run `pnpm test:unit` and `pnpm typecheck`. Every runtime test should fail, because the stub renders nothing; none should fail from import or type errors. Note the count.
4. List the tests that pass against the stub (`pnpm exec vitest run --project unit src/components/<Name> --reporter=verbose`). Type-only tests (`expectTypeOf`) pass at runtime by design; `pnpm typecheck` checks them. **Any other test that passes is vacuous**: it only asserts that something is absent, so an empty render satisfies it. Make it stricter by asserting a positive precondition first (the control or hidden input exists), and rerun until only type tests pass.

## Phase 4: Implement

1. Add any new token to `tokens/tokens.json` with a usage note, then `pnpm tokens`. Never edit generated CSS.
2. Write `<Name>.tsx` (JSDoc on the component and every prop) and `<name>.css` (in `@layer components`).
3. Add `index.ts`, export from `src/index.ts`, and import the CSS in `src/styles/index.css`.
4. Add every new color pair to `tokens/contrast.json`.
5. Make the tests pass by fixing the component. **Never delete, skip, weaken, or comment out a test.** If a test looks wrong, work out whether the component or the test is at fault. A test with a real bug (such as a focus assumption broken by an earlier click) may be fixed in a way that checks the same behavior at least as strictly; say so in the final report. If you think the expected behavior itself is wrong, stop and ask the user. The test-removal hook will flag removed tests or assertions.

## Phase 5: Stories

Write `<Name>.stories.tsx`: a `Playground` with controls; a `States` story showing every state side by side (Phase 7's focus check opens it, and the first Tab must land in it); one story per variant group or state; and `AllThemes` with every state in all three themes. Keep `play` functions to short demos, plus the CSS-dependent checks listed in Phase 3.

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

Screenshot the `AllThemes` story in all three themes with the recipe under "Looking at a component" in `CLAUDE.md`, saving to the scratchpad directory, and open each image with the Read tool. Check alignment, every state, focus, hot dog mode, and dark mode.

For a text field, type a value into the fields before screenshotting, so browser-drawn pieces show up: search clear buttons, autofill colors, number spinners, and password reveal buttons. Each must be themed, hidden, or a deliberate choice written down.

Then check what the theme screenshots can't show, with the second recipe there: a focused control, the `AllThemes` story with forced colors emulated, and hover. **For every state that changes an edge or a fill (checked, selected, invalid, and so on), compare the computed style at rest and while hovered, in normal mode and in forced colors.** Hover must never cover up a state: a hovered "on" Switch once lost its fill and hid its thumb in forced colors, and a hovered invalid Input once lost its red edge. Use real hover through Playwright (`locator.hover()`); a story's `userEvent.hover` doesn't trigger CSS `:hover`.

If any part is dimmed with `opacity` (read-only, for example), check the contrast of everything inside it at that opacity, placeholders and icons included. `pnpm check:contrast` only knows undimmed pairs, so compute the composited colors by hand (blend each color with the page color at the opacity) and check 4.5:1 for text and 3:1 for edges and meaningful icons.

Fix what looks wrong and check again.

## Phase 8: Docs

If the component introduces a new pattern or rule, add it to `CLAUDE.md` (code rules) or the right `docs/brand/` page (design rules). Don't restate what's already there.

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
