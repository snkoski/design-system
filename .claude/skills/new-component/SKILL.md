---
name: new-component
description: Build a new design-system component start to finish (research, an API proposal for approval, tests first, implementation, stories, checks, screenshots, and an independent review), following CLAUDE.md. Use when the user asks for a new component.
argument-hint: "[ComponentName] [MoreNames...]"
disable-model-invocation: true
---

# New component

Build the component or components the user named (`$ARGUMENTS`). `CLAUDE.md` is the rulebook and is already loaded; this skill is the order of work and the checks. Where `CLAUDE.md` states a rule, follow it there rather than looking for it here. If the two ever disagree, `CLAUDE.md` wins; say so in the final report.

If `$ARGUMENTS` is empty, ask which component to build and stop.

**Normalize the name.** The component name is PascalCase whatever the user typed (`radio group` → `RadioGroup`). Below, `<Name>` is that name and `<name>` its kebab-case form (`radio-group`).

**Supporting files** in this folder, read when they apply:

- `variants.md`: read it now if the user named more than one component, or asked for an experiment built to these rules.
- `checks.md`: checks that depend on what the component is or does, one row each. Phases 1, 3, and 7 send you there.
- `troubleshooting.md`: read it when something fails in a way the component can't explain.

**Phase 2 ends in a hard stop for the user's approval.** Don't write component files before it.

## Phase 1: Research

**First, check you can start.**

1. Read the "Open questions" table in `docs/proposed-roadmap-job-tracker.md`. If any question is still "Open", stop: name it and say it blocks new components (`CLAUDE.md`, "Open questions block new components").
2. The branch is based on the latest `main`, and any dependency you've added is still in `node_modules`. Another session can switch branches or reinstall packages under you; if one does, suggest a worktree.

**Then research.**

1. Read `docs/brand/accessibility.md`, `building.md`, `platforms.md`, and `voice.md`. Also read `forms.md` for a form control, `motion.md` if anything moves, and `iconography.md` if it draws icons. Check `docs/brand/industry.md` for a section on this kind of component, and see how the major systems it compares name it, which variants they offer, and where they disagree.
2. Pick the reference component and read all its files: `Checkbox` for choice controls, `Input` for text fields (`TextArea` or `NativeSelect` if it renders `Field.Control` as another element), `Button` for actions, and `Spinner` for anything with nothing to press or focus. Match its structure, prop names, JSDoc style, and test layout unless there's a reason not to.
3. Look for the component in Base UI (`node_modules/@base-ui/react/docs/react/components/`) and shadcn/ui (https://ui.shadcn.com/docs/components). If neither has one by that name, don't quietly pick the closest. List the Base UI primitives it could be built on, and for each note what it's for, what a screen reader announces, its keyboard behavior, and what it gives up (no form `name`, nothing selectable, and so on). Research each candidate below; the choice goes to the user in Phase 2.
4. Render the primitive in a throwaway test, with every state you'll style turned on (inside `Field.Root` for a form control). Log the DOM to see the exact ARIA and `data-*` attributes, and style from what it emits, not from memory. In the same test, focus it and press Space, Enter, and every key its pattern uses (arrows, Home, End, Escape), logging what changes: similar primitives differ (Enter toggles a Switch but not a Checkbox).

   ```sh
   mkdir -p src/scratch   # write src/scratch/proto.test.tsx that renders it and console.logs container.innerHTML
   pnpm exec vitest run --project unit src/scratch/proto.test.tsx --silent=false
   rm -rf src/scratch
   ```

5. Go through the "Research" table in `checks.md` and do every row that applies.

## Phase 2: Design proposal (stop for approval)

Write the proposal. Keep it to what the user needs to decide.

- **What it is and when to use it**, in one or two sentences, and what it should not be used for.
- **Built on:** the Base UI primitive and parts, and the reference component. If Base UI and shadcn have nothing by that name, say so first, put the Phase 1 candidates in a table (what each is for, what a screen reader announces, what it gives up), recommend one, and make the choice the first open question.
- **Props table:** name, type, default, and what it maps to (`data-*` attribute, ARIA attribute, or Base UI prop). Mark anything that differs from the reference component, and why.
- **Anatomy:** the elements and their classes.
- **States**, and the ARIA or `data-*` attribute that drives each one's style.
- **Keyboard behavior** as recorded in Phase 1, and where it differs from the reference component.
- **Sizes:** height and hit area with a mouse, on touch, and in compact density, from the size tokens.
- **How other systems do it:** what the major systems call it, their variants, and where they differ, with what we chose. Check each cell against the system's own docs, not memory: a research agent with web access can read them in parallel while you write the rest, returning the URL behind each fact and "Not stated" where a page doesn't say. (NativeSelect's draft guessed two systems wrong.) It becomes `industry.md` content in Phase 8, with those URLs as sources.
- **When to use each variant**, if it has variants or could be confused with another component. It becomes a guidance page in Phase 8.
- **Tokens:** existing ones it uses, and any new one (name, value, and usage note).
- **Color pairs** for `tokens/contrast.json`. Check each before proposing it with `pnpm check:contrast --probe fg:bg:min ...`, which doesn't touch the file.
- **Motion:** what moves, with which tokens.
- **Hot dog and forced-colors treatment.**
- **Open questions:** decisions that are the user's, each with a recommendation.

**Then loop the `junior-engineer` agent over it before the user sees it** (`subagent_type: junior-engineer`):

1. Write the proposal to a file in the scratchpad. Give a fresh agent only its path, the repo root, and the revision (`git rev-parse HEAD`), never your reasoning. Tell it the open questions are the user's, so it flags what they leave unclear rather than repeating them.
2. Answer every question it raises that isn't the user's, checking by running code where you can, and fold the answers in. For a question about an open question's option, specify that option fully, so the user picks between complete designs. If that changes your recommendation, say so and why.
3. Run a fresh agent on the new draft. Repeat until it reports no blocking questions.

**Then present it and stop.** Give the user the proposal and its open questions, and get an explicit pick for each; a general "yes" isn't approval of your recommendations. Record their answers as decisions, remove the options they didn't pick, and run a fresh junior engineer again. Keep looping, with the user for anything that's theirs, until neither has an open question. Continue only after the user approves; if they change the design later, update the proposal and confirm again.

## Phase 3: Tests first

1. Write the props type and a stub component that renders `null` in `<Name>.tsx`, so the test file typechecks.
2. Write `<Name>.test.tsx` from the approved API, covering the list in `CLAUDE.md`'s Testing section, with `expectTypeOf` for every rule enforced in types. Go through the "Tests" table in `checks.md` and add every row that applies. Checks that need CSS or layout go in stories, not here: list them now for Phase 5.
3. Run `pnpm test:unit` and `pnpm typecheck`. Every runtime test should fail against the stub, and none from import or type errors. Note the count.
4. List the tests that pass against the stub (`pnpm exec vitest run --project unit src/components/<Name> --reporter=verbose`). Only type-only tests should pass. Any other is vacuous: make it assert a positive precondition first, and rerun until only type tests pass.

## Phase 4: Implement

1. Add any new token to `tokens/tokens.json` with a usage note, then run `pnpm tokens`.
2. Write `<Name>.tsx` and `<name>.css`, then do the rest of `CLAUDE.md`'s "Adding a component" list (exports, the CSS import, and color pairs). A form control uses the shared CSS in `src/internal/` (`CLAUDE.md`, Form controls, "Shared CSS"). If a shared rule has to change, change it in the shared file and check every control that uses it.
3. Make the tests pass by fixing the component, never by weakening a test. A test with a real bug (such as a focus assumption broken by an earlier click) may be fixed so it checks the same behavior at least as strictly; say so in the report. If you think the expected behavior itself is wrong, stop and ask the user.

## Phase 5: Stories

Write `<Name>.stories.tsx` with the stories `CLAUDE.md` requires ("Adding a component", step 5). Add the CSS-dependent checks listed in Phase 3 as `play` functions, each run with a mouse and on touch. Story copy is real copy: follow `docs/brand/voice.md`.

## Phase 6: Verify

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm build-storybook
pnpm check:tests
```

Fix what they report.

Then run `pnpm look <Name> --out <scratchpad>/<name>` (`CLAUDE.md`, "Looking at a component") and fix any story it reports as failed. `pnpm test` uses the dev server, whose timing hides a `play` function that starts too early; the built Storybook doesn't. Phase 7 uses the same run's screenshots.

Then prove the tests can fail. Break the component three ways that matter (a state no longer reaching its ARIA attribute, a decorative icon losing `aria-hidden`, the label no longer naming the control), one at a time: back up the file with `cp`, break it, run `pnpm test:unit`, restore it with `cp`, and confirm with `diff` that it matches the backup. **Never restore with `git checkout`**: the component is uncommitted, and that would discard it. Each break must fail at least one test; if one doesn't, add the missing test.

## Phase 7: Look at it

1. Open every screenshot from Phase 6's `pnpm look` with the Read tool (rerun it after any fix). In each theme, check alignment, every state, the focus ring, hot dog, and dark mode. In the coarse and compact shots, it must grow or shrink with the tokens, keep icons and labels centered, and overlap nothing. In the forced-colors shot, every state and label must still show.
2. Read its state colors. For each state hover changes, check the hovered look still shows the state; for each it flags as matching `Canvas`, find it in the forced-colors shot.
3. Go through the "Look" table in `checks.md` and do every row that applies.

Fix what looks wrong and check again.

## Phase 8: Docs

- A new pattern or rule goes in `CLAUDE.md` (code rules) or the right `docs/brand/` page (design rules). Don't restate what's already there.
- The proposal's "When to use each variant" becomes a guidance page, `docs/brand/<topic>.md`, rendered by `src/components/<Name>/<Name>.mdx` (`buttons.md` and `Button.mdx` are the pattern).
- The "How other systems do it" table goes in `docs/brand/industry.md`, with sources. Every link added there also goes in `docs/reading-list.json` under the component's topic (add the topic if it's new); then run `pnpm reading-list`. A link whose system isn't in the JSON's `systems` list won't show in the component sections, so say so rather than adding it with no system.
- Write `src/components/<Name>/HowItWorks.mdx` following "How it works pages" in `CLAUDE.md`: the files and Base UI parts it's built from, an `<Inspect>` of the real component in its main states, how its props become attributes, and its CSS rule by rule (states, focus, forced colors, hot dog, touch sizes, and motion). Check it in Storybook with no console errors.
- Add `src/components/<Name>/Tests.mdx`, a copy of Button's with the name changed (see "Tests pages" in `CLAUDE.md`). It lists the tests by name, so name each `it(…)` for what it checks.

## Phase 9: Independent review

Run this yourself; the user doesn't start it. Spawn the `component-reviewer` agent (`subagent_type: component-reviewer`) with: "Review the component `<Name>` in `src/components/<Name>/`. Follow your instructions and return the report in the exact shape they give." If that type isn't available, spawn a general-purpose agent told to read and follow `.claude/agents/component-reviewer.md` exactly. Tell it nothing about how you built the component.

Fix every Must fix, then rerun Phase 6's commands. Fix the clear Should fix and Consider items, and list the rest for the user with your recommendation.

If the review finds the same bug in an existing component, fix it there too, with a test where one can catch it, in its own commit. Removing any test, even a redundant one, needs the user's approval.

## Phase 10: Report and stop

Tell the user:

- What was built, and the test count.
- Decisions made, and anything to revisit.
- What the review found and what you changed.
- Anything you couldn't verify.
- **Improvements to this skill**: anything wrong, missing, out of order, or slow. Before proposing one, sort it:
  - A **rule** about how components are built goes in `CLAUDE.md` or `docs/brand/`, not here.
  - A **check** for one kind of component is one row in `checks.md`, with at most one clause of why.
  - Something a **script or `pnpm check`** could catch is better automated; propose that instead.
  - Only a change to the **order of work** belongs in this file.

Then ask whether to commit. **Don't commit or push unless the user says to.** Split commits by topic: fixes to existing components first, then the new component, then changes to this skill or the reviewer.

Edits to this skill take effect in the next run only after the user runs `/reload-skills`; say so when you change it.
