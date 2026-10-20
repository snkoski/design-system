# Revisit later

Decisions we made for now but may want to change, and questions we haven't answered yet. Each entry says what we do today, why, and what would settle it. When one is decided, move the outcome into `CLAUDE.md` or `docs/brand/` and delete the entry.

## A disabled radio group can still be reached with Tab

**Today:** in a disabled RadioGroup, Base UI keeps the selected radio (or the first one) in the tab order with `tabindex="0"` and `aria-disabled="true"`. Tab lands on it and nothing else happens. We keep Base UI's behavior, because CLAUDE.md says never to hand-roll focus handling. Because the dim would also dim the focus outline below 3:1, a focused disabled radio shows its circle at full strength (`radio-group.css`); its label stays dimmed.

**Why it's in question:** it's inconsistent with the rest of the system. A disabled Checkbox, Switch, Input, or CheckboxGroup option is skipped by Tab. Our instinct is that a disabled group should be skipped too.

**To decide:**
- Why does Base UI do this? Look for the reasoning in its source, issues, or changelog. One possible reason: ARIA's composite-widget guidance lets a disabled widget stay focusable, so screen-reader users can find it and hear that it's unavailable.
- Is it deliberate in Base UI, or a bug that will change in a later version?
- If we want it skipped, can that be done through Base UI's own props rather than by overriding focus ourselves?

Raised while building RadioGroup (2026-10-20).

## Shared CSS for choice controls and groups

**Today:** the CSS is duplicated. `radio-group.css` repeats CheckboxGroup's group styles (label, description, stacked options, and the error placement), and its radio circle repeats much of Checkbox's box (edge, hover, focus, invalid, read-only, disabled, hit area, hot dog press, and forced colors). Switch already repeats some of the same pieces.

**Why it's in question:** a fix to one copy can be missed in the others. Checkbox's invalid edge disappearing in forced colors is the kind of bug that would have to be fixed in every copy.

**To decide:** whether to extract shared CSS, such as a group stylesheet and a choice-control base in `src/internal/`, the same way `field-error.css` is shared now. Also how the shared class names would sit next to each component's own classes, and how to do it without changing how any component looks (Chromatic would show any difference).

Raised while building RadioGroup (2026-10-20).
