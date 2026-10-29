# Temporary roadmap

A rough list of components, not a plan. It came from a quick talk about what one app (the first project we may rebuild with this system) would need, so it's shaped by that app: the mention autocomplete and the facepile come from it. Nothing here is decided, and the order is a guess. Replacing it with a full roadmap is an open question in `docs/revisit.md` ("A full roadmap"). Delete this file when that's done.

**Status** says what exists today (2026-10-29).

## Tier 1: primitives, used on every screen

| # | Component | Status |
| --- | --- | --- |
| 1 | Button with primary, ghost or link, and toggle variants, plus an icon-only button | Mostly built: Button has primary, secondary, and ghost, `iconOnly` with a required `aria-label`, and ButtonLink. No toggle (pressed) button yet. |
| 2 | Text input and text area | Built: Input and TextArea |
| 3 | Checkbox, radio, and a segmented control | Built: Checkbox, CheckboxGroup, RadioGroup, SegmentedControl, and Switch |
| 4 | A Field wrapper for label, hint, and error | Partly: every form control builds its own field on Base UI's `Field`, and the error is the shared `FieldError` in `src/internal/`. Nothing public wraps a custom control. |
| 5 | An icon set | Not built. Components take any icon as a `ReactNode`; `docs/brand/iconography.md` picks Lucide, which is only a dev dependency, for stories. |
| 6 | Avatar, with presence | Not built |
| 7 | Badge, dot, and chip | Not built |

## Tier 2: overlays, the most valuable behavior to centralize

| # | Component | Status |
| --- | --- | --- |
| 8 | Dialog or modal, with header, body, and actions, a focus trap, Escape to close, scroll lock, and `aria-modal` | Not built |
| 9 | Popover, and menu or dropdown | Not built |
| 10 | Listbox or combobox, which covers the mention autocomplete | Not built |
| 11 | Toast | Not built |
| 12 | Tooltip (the app uses `title` attributes today) | Not built |

## Tier 3: composites

| # | Component | Status |
| --- | --- | --- |
| 13 | Tabs | Not built |
| 14 | Banner or notice | Not built |
| 15 | Empty state | Not built |
| 16 | A reusable list row | Not built |
| 17 | Collapsible section | Not built |
| 18 | Password field | Not built |
| 19 | Avatar group (the facepile) | Not built |

## Tier 4: layout

| # | Component | Status |
| --- | --- | --- |
| 20 | An app shell with a rail, sidebar, main area, and side panel | Not built |
| 21 | A centered sign-in card | Not built |

## Not on this list, but the docs already expect

- An error summary for forms with two or more errors, fully described in `docs/brand/forms.md`.
- A danger tone for buttons, planned in `docs/brand/buttons.md`.
- A spinner and a skeleton, which `--duration-loop` is for. Button already draws its own spinner.
- A high-contrast theme, marked "future" in `docs/brand/color.md`.
