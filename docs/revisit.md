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

**To decide:** whether TextArea gets a counter, how it announces itself (for example, only near the limit), and whether going over the limit is blocked or shown as an error. The RichText experiment needs the same answer, counting the text people see rather than its markdown.

Raised while building TextArea (2026-10-21). RichText added (2026-10-21).

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

## Enter to send in RichText

**Today:** in the RichText experiment, Enter starts a new paragraph (or a new list item), Shift+Enter adds a line break inside the paragraph, and Mod+Enter also adds a line break (Tiptap's default). Nothing sends.

**Why it's in question:** it's planned. Chat-style message fields usually send on Enter. People who write longer messages want Enter for new lines and Mod+Enter to send. The field needs a setting for which way round it works.

**To decide:** the prop (for example `submitOn="enter" | "mod-enter"`), what "send" calls (a callback, or submitting the field's form), what Shift+Enter does in each mode, what happens inside a list or code block (where Enter usually adds an item or a line), and how the field tells people which key sends, in words, for screen readers too. RichText keeps its keyboard shortcuts in one place (`markdown.ts` and the toolbar tools in `RichText.tsx`), so this goes there.

Raised while building RichText (2026-10-21).

## Choosing which RichText buttons appear

**Today:** the RichText toolbar always has all ten buttons: bold, italic, underline, strikethrough, inline code, link, quote, bulleted list, numbered list, and code block. Their markdown shortcuts and keyboard shortcuts always work.

**Why it's in question:** some fields need less, such as a comment box with no code blocks. Hiding a button while its shortcut still works would be confusing, so turning a format off has to remove the button, the shortcut, the typed markdown rule, and the format on paste.

**To decide:** whether to add a prop such as `formats={["bold", "italic", "link"]}`, what pasted or loaded markdown does with a format that's off (keep its text), and whether the toolbar can be hidden entirely for a field that only takes shortcuts.

Raised while building RichText (2026-10-21).

## Syntax colors in RichText code blocks

**Today:** code blocks in the RichText experiment are plain monospace text on `surface-tint`. A language after the fence (```` ```js ````) is kept in the markdown but not shown.

**Why it's in question:** colored code is easier to read. It needs a highlighting library (Tiptap's CodeBlockLowlight with lowlight), which adds noticeably to the size, and a set of syntax colors that meet 4.5:1 in all three themes, hot dog included.

**To decide:** whether messages carry enough code to be worth the size, and which colors, as tokens.

Raised while building RichText (2026-10-21).

## Nested lists in RichText

**Today:** Tab always moves on to the next control, as in any field, so a list item can't be indented from the keyboard, and the toolbar has no indent button. Nested lists in loaded or pasted markdown still show, nested.

**Why it's in question:** word processors indent list items with Tab. Doing that makes Tab do two things depending on where the caret is, which is surprising for keyboard users, and a field mustn't trap Tab.

**To decide:** whether nested lists are needed in messages at all. If so, indent and outdent toolbar buttons with their own shortcuts (Mod+] and Mod+[ are common) keep Tab predictable.

Raised while building RichText (2026-10-21).

## A taller RichText

**Today:** RichText starts one line tall and grows to four lines, then scrolls (`rows` 1, `maxRows` 4), like a chat message field. Both can be changed, so a taller field already works by setting them.

**Why it's in question:** a field for long writing, such as a post or a document, might want a different look: more room from the start, the toolbar somewhere else, or no scrolling at all.

**To decide:** whether `rows` and `maxRows` are enough, or a separate multi-line variant is worth having, once there's a real use for one.

Raised while building RichText (2026-10-21).

## How read-only fields look

**Today:** each control does its own thing. Input and TextArea dim the field to 75% and hide the placeholder, keeping the label at full strength. Checkbox, Switch, and Radio dim the control to 75%. SegmentedControl dims only the options that aren't chosen, because the chosen option's label sits on its fill. The RichText experiment hides its toolbar and doesn't dim at all, because links and inline code would fall below 4.5:1 at 75%.

**Why it's in question:** the rule is that people should be able to tell a field can't be changed before they try (`docs/brand/accessibility.md`). A 75% dim is a quiet cue, and it can't be used wherever colored text would lose contrast. There's no one pattern yet for what read-only should mean visually.

**To decide:** what read-only is for in the sites and apps that use the system (showing a saved value, a locked setting, a sent message), and then one cue for all of it. Options: the dim; dropping the field's edge and background so it reads as plain text; or a "Read only" note or lock icon beside the label, in words. Whatever is chosen has to meet contrast in every theme and work in forced colors.

Raised while building RichText (2026-10-21).

## A danger style for buttons

**Today:** Button has no danger style. A destructive action is a `secondary` button whose label names what's lost, behind a confirmation dialog (`docs/brand/buttons.md`).

**Why it's in question:** most systems give destructive actions their own look (Carbon, Primer, Atlassian, and Uber's Base), so they stand out in a confirmation dialog or a settings page.

**To decide:** a `tone="danger"` prop (`data-tone="danger"`) on `primary`, `secondary`, and `ghost`, never on icon-only buttons. It needs `danger-hover` and `on-danger` tokens that pass contrast in all three themes, and its own look in hot dog mode, where `action` is already ketchup red and a danger fill would match the primary button.

Raised while comparing button systems (2026-10-22).
