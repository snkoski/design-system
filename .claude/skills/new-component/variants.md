# Variants of the run

## Several components at once

When the user names more than one (`/new-component Meter Progress`), they're a set that must match, built in the order named. Every phase applies to each one, with these differences:

- **Phase 1** researches all of them together: read the docs once, and render every primitive in the same throwaway test, so their DOM and attributes can be compared side by side.
- **Phase 2** is one proposal. It opens with what they share: the look, the props that mean the same thing (same name, type, and default in each), and where the shared code goes. That last one is an open question for the user, with a recommendation: a sibling in the first component's folder sharing its CSS (`ButtonLink` beside `Button`), or a shared file in `src/internal/` whose class each one's parts carry next to their own (`choice.css`). Then one section per component, saying only where it differs from the shared part.
- **Phases 3 to 8** run for the first component all the way through, screenshots and docs included, before the next one's Phase 3 starts, so a later component builds on shared code that's already finished and tested. If a later one changes shared code, rerun the earlier one's tests and screenshots.
- **Phase 8**: one guidance page and one `industry.md` section can cover the set when choosing between them is the main question. Each still gets its own "How it works" page.
- **Phase 9** runs one reviewer per component, in parallel, each told the others' names, so it checks they match.
- **Phase 10** is one report, with the test count and anything unverified given for each component. Commits: fixes to existing components first, then one commit per component in build order, then changes to this skill.

## An experiment built to these rules

When the user asks for an experiment in `src/experiments/<Name>/` to follow this skill anyway, every phase applies. An experiment never changes components, styles, or tokens and is never published, so:

- No `index.ts`, no export from `src/index.ts`, and no import in `src/styles/index.css`: the component imports its own CSS.
- No new tokens and no `tokens/contrast.json` pairs. Write any color it needs in its CSS with a comment saying it becomes a token if the experiment graduates, and check its contrast with a `play` function on the `AllThemes` story (`pnpm check` doesn't look at experiments).
- New dependencies go in `devDependencies`.
- The story title is `Experiments/<Name>`, so screenshot ids start `experiments-<name>--`.
- Phase 9 points the reviewer at `src/experiments/<Name>/` and names the reference component.
