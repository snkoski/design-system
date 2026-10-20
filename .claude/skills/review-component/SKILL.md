---
name: review-component
description: Review one design-system component against CLAUDE.md and the brand book, in a fresh context that hasn't seen how it was built. Use after building or changing a component, or to audit an existing one.
argument-hint: "[ComponentName]"
context: fork
agent: component-reviewer
background: false
---

Review the component `$0` in `src/components/$0/`.

If `$0` is empty or that folder doesn't exist, list the folders in `src/components/` and stop, saying which name to pass.

Follow your instructions as the component reviewer: read the rulebook and the reference component, run the checks, and return the report in the exact shape your instructions give. Do not modify any file.
