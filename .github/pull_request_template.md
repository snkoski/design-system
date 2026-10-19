## What changed and why

<!-- A few sentences. For a new component, say which Base UI primitive it builds on. -->

## Checklist

- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm build-storybook` pass
- [ ] Components have a `Name.test.tsx`, and no test was deleted, skipped, or weakened to get a pass
- [ ] New or changed components have a `Playground` story and an `AllThemes` story
- [ ] Contrast and focus checked in light, dark, and hot dog
- [ ] Components use semantic tokens only, and any new token has a `usage` note
- [ ] `docs/brand/` and `CLAUDE.md` are updated if a rule or pattern changed
- [ ] Breaking changes (renamed or removed props, tokens, or exports) are called out below

## Review

Chromatic posts a Storybook preview link and a visual diff on this pull request. Check both.

Add a screen recording here only for what a still image can't show, such as motion or a multi-step interaction. Note anything you checked by hand that the tests don't cover: forced-colors mode, a screen reader, or 400% zoom.

## Breaking changes

<!-- Delete this section if there are none. -->
