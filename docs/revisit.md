# Revisit later

Decisions we made for now but may want to change, and questions we haven't answered yet. Each entry says what we do today, why, and what would settle it. When one is decided, move the outcome into `CLAUDE.md` or `docs/brand/` and delete the entry.

## A disabled radio group can still be reached with Tab

**Today:** in a disabled RadioGroup, Base UI keeps the selected radio (or the first one) in the tab order with `tabindex="0"` and `aria-disabled="true"`. Tab lands on it and nothing else happens. We keep Base UI's behavior, because CLAUDE.md says never to hand-roll focus handling. Because the dim would also dim the focus outline below 3:1, a focused disabled radio shows its circle at full strength (`radio-group.css`); its label stays dimmed.

**Why it's in question:** it's inconsistent with the rest of the system. A disabled Checkbox, Switch, Input, or CheckboxGroup option is skipped by Tab. Our instinct is that a disabled group should be skipped too.

**To decide:**
- Why does Base UI do this? Look for the reasoning in its source, issues, or changelog. One possible reason: ARIA's composite-widget guidance lets a disabled widget stay focusable, so screen-reader users can find it and hear that it's unavailable.
- Is it deliberate in Base UI, or a bug that will change in a later version?
- If we want it skipped, can that be done through Base UI's own props rather than by overriding focus ourselves?

SegmentedControl is built on the same RadioGroup and behaves the same way, so whatever is decided applies to both. Rendering the radios as native buttons isn't the answer: Base UI makes the chosen radio the Tab stop, so a chosen, disabled button would hide the whole group from Tab, even with other options enabled.

Raised while building RadioGroup (2026-10-20).

## Shared CSS for form controls

**Today:** the CSS is duplicated. `radio-group.css` repeats CheckboxGroup's group styles (label, description, stacked options, and the error placement), and its radio circle repeats much of Checkbox's box (edge, hover, focus, invalid, read-only, disabled, hit area, hot dog press, and forced colors). Switch already repeats some of the same pieces. `text-area.css` repeats most of Input's: the label, description, edge, hover, focus, invalid, disabled, read-only, hot dog, and forced colors.

**Why it's in question:** a fix to one copy can be missed in the others. Checkbox's invalid edge disappearing in forced colors is the kind of bug that would have to be fixed in every copy.

**To decide:** whether to extract shared CSS, such as a group stylesheet, a choice-control base, and a text-field base in `src/internal/`, the same way `field-error.css` is shared now. Also how the shared class names would sit next to each component's own classes, and how to do it without changing how any component looks (Chromatic would show any difference).

Raised while building RadioGroup (2026-10-20).

## A text area that grows with its text

**Today:** a TextArea starts at a fixed number of `rows` and scrolls when the text is longer. People can drag it taller with the resize handle.

**Why it's in question:** many forms let a text area grow as you type, so nothing scrolls. CSS can do it with no JavaScript (`field-sizing: content`), but Firefox doesn't support it yet, so a TextArea would behave differently there.

**To decide:** whether to add it as an opt-in (for example, a `grow` prop with a maximum height) once Firefox supports `field-sizing`, or sooner with Firefox keeping the fixed height.

Raised while building TextArea (2026-10-21).

## A character counter for text areas

**Today:** `maxLength` passes through to the `<textarea>`, and the browser stops typing at the limit. Nothing shows how many characters are left, so the description has to say what the limit is.

**Why it's in question:** a counter ("120 of 500") helps people stay under a limit. It has to tell screen readers how much room is left without announcing every keystroke, which needs its own design: when to announce, how politely, and how it looks over the limit.

**To decide:** whether TextArea gets a counter, how it announces itself (for example, only near the limit), and whether going over the limit is blocked or shown as an error.

Raised while building TextArea (2026-10-21).

## Invalid text fields in hot dog mode with forced colors

**Today:** in forced colors, an invalid Input or TextArea shows a thick (`border-thick`) edge instead of a thin one, because the red edge and its inset shadow are gone. Hot dog mode already gives every text field a thick edge, so in hot dog with forced colors an invalid field's edge looks the same as a valid one. The error message's icon and words still say it's invalid, so color or edge never carries the meaning alone.

**Why it's in question:** in every other theme the edge itself changes, so this is the one combination where it doesn't. It's rare: hot dog is a joke theme, and forced colors replaces its colors anyway.

**To decide:** whether it's worth a different edge there (for example, a dashed or double border for invalid fields in forced colors), and fixing Input and TextArea together, ideally as part of sharing text-field CSS (see "Shared CSS for form controls").

Raised while building TextArea (2026-10-21).

## The secondary button's background in the Building page

**Today:** the CSS example on the Building page (`docs/brand/building.md`) gives a secondary button `background: transparent`. The real Button uses `var(--surface)` (`button.css`), so a secondary button is white, or the dark surface, rather than showing the page through it.

**Why it's in question:** the brand book is the source of truth, and here it disagrees with the code. Someone copying the example, or rebuilding Button from the docs, would get a different button.

**To decide:** which is right. If `surface` is, fix the example. If `transparent` is, change `button.css`, which Chromatic would show as a change wherever a secondary button sits on a tinted or colored background. Either way, the contrast pairs for secondary buttons should match the background chosen.

Raised while planning SegmentedControl (2026-10-21).

## A full-width segmented control

**Today:** a SegmentedControl is as wide as its options need, with every option as wide as the widest. There's no way to stretch it across its container, and a layout class on its wrapper doesn't stretch the track.

**Why it's in question:** on phones and in narrow side panels, a control that fills the width often looks more settled, and gives each option a bigger target.

**To decide:** whether we hit a layout where it looks wrong. If so, add it as a design choice (for example, a `width="fill"` prop rendered as `data-width`), or let a consumer's width class reach the track.

Raised while building SegmentedControl (2026-10-21).

## How a chosen segment stands out

**Today:** the chosen option in a SegmentedControl is filled with `action`, and its label turns semibold (600, from 400). An icon's lines get thicker (`icon-stroke-bold`, 2.75, from `icon-stroke`, 2). The bold is the cue that doesn't rely on color, because `action` is only 2.89:1 against `surface` in light mode, under the 3:1 a non-text cue needs.

**Why it's in question:** a weight change is quieter than the marks other choice controls use (a tick, a dot, a thumb's position). Icons that aren't drawn with lines, such as filled icons, don't get thicker at all.

**To decide:** look at it in use. If the bold isn't clear enough, try a different fill (such as `ink`, which is strong in every theme) or a check mark in the chosen option, as Material's segmented buttons do.

Raised while building SegmentedControl (2026-10-21).
