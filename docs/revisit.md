# Revisit later

Decisions we made for now but may want to change, and questions we haven't answered yet. Each entry says what we do today, why, and what would settle it. When one is decided, move the outcome into `CLAUDE.md` or `docs/brand/` and delete the entry.

Where an answer comes from looking, Storybook's **Revisit** section shows the options side by side, in all three themes (`src/experiments/Revisit/`). Delete an entry's comparison story along with the entry.

## A disabled radio group can still be reached with Tab

**Today:** in a disabled RadioGroup, Base UI keeps the selected radio (or the first one) in the tab order with `tabindex="0"` and `aria-disabled="true"`. Tab lands on it and nothing else happens. We keep Base UI's behavior, because CLAUDE.md says never to hand-roll focus handling. Because the dim would also dim the focus outline below 3:1, a focused disabled radio shows its circle at full strength (`radio-group.css`); its label stays dimmed.

**Why it's in question:** it's inconsistent with the rest of the system. A disabled Checkbox, Switch, Input, or CheckboxGroup option is skipped by Tab. Our instinct is that a disabled group should be skipped too.

**To decide:**
- Why does Base UI do this? Look for the reasoning in its source, issues, or changelog. One possible reason: ARIA's composite-widget guidance lets a disabled widget stay focusable, so screen-reader users can find it and hear that it's unavailable.
- Is it deliberate in Base UI, or a bug that will change in a later version?
- If we want it skipped, can that be done through Base UI's own props rather than by overriding focus ourselves?

SegmentedControl is built on the same RadioGroup and behaves the same way, so whatever is decided applies to both. Rendering the radios as native buttons isn't the answer: Base UI makes the chosen radio the Tab stop, so a chosen, disabled button would hide the whole group from Tab, even with other options enabled.

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

**To decide:** whether it's worth a different edge there (for example, a dashed or double border for invalid fields in forced colors), which would be one change in `src/internal/text-field.css` now that Input, TextArea, and NativeSelect share it.

Raised while building TextArea (2026-10-21).

## The secondary button's background in the Building page

**Today:** the CSS example on the Building page (`docs/brand/building.md`) gives a secondary button `background: transparent`. The real Button uses `var(--surface)` (`button.css`), so a secondary button is white, or the dark surface, rather than showing the page through it.

**Why it's in question:** the brand book is the source of truth, and here it disagrees with the code. Someone copying the example, or rebuilding Button from the docs, would get a different button.

**To decide:** which is right. If `surface` is, fix the example. If `transparent` is, change `button.css`, which Chromatic would show as a change wherever a secondary button sits on a tinted or colored background. Either way, the contrast pairs for secondary buttons should match the background chosen.

**Compare in Storybook:** Revisit → Secondary button background.

Raised while planning SegmentedControl (2026-10-21).

## A full-width segmented control

**Today:** a SegmentedControl is as wide as its options need, with every option as wide as the widest. There's no way to stretch it across its container, and a layout class on its wrapper doesn't stretch the track.

**Why it's in question:** on phones and in narrow side panels, a control that fills the width often looks more settled, and gives each option a bigger target.

**To decide:** whether we hit a layout where it looks wrong. If so, add it as a design choice (for example, a `width="fill"` prop rendered as `data-width`), or let a consumer's width class reach the track.

**Compare in Storybook:** Revisit → Full-width segmented control.

Raised while building SegmentedControl (2026-10-21).

## How a chosen segment stands out

**Today:** the chosen option in a SegmentedControl is a rounded `surface` highlight (white, or the card color in dark mode) set just inside the option on the gray `track`, with an `ink` border. The border is far above 3:1 against the track and the fill in every theme, so it's the cue that doesn't rely on color. The label and icons don't change: the bold label and thicker icon lines it used to have were dropped (2026-10-27), so the control never changes size and filled icons need nothing special.

**Why it's in question:** the border is a strong mark, but it's the only one besides color. Other choice controls add a shape (a tick, a dot, a thumb's position).

**To decide:** look at it in use. The `ink` fill this entry suggested trying was tried and replaced by the white option with an ink border. What's left is whether a check mark in the chosen option, as Material's segmented buttons have, adds anything to it.

**Compare in Storybook:** Revisit → How a chosen segment stands out (today and the check mark).

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

**Today:** code blocks in the RichText experiment are plain monospace text on `surface-hover`. A language after the fence (```` ```js ````) is kept in the markdown but not shown.

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

## Icon size in large buttons and segments

**Today:** Button's and SegmentedControl's `lg` sizes use `icon-md` (20px), the same as `md`. `docs/brand/iconography.md` says large buttons use `icon-lg` (24px).

**Why it's in question:** a 24px icon next to `body-lg` text may look better balanced, as in Material's touch sizes, or it may look heavy beside the label.

**To decide:** look at `lg` buttons and segments with each icon size side by side in Storybook, with icons before and after the label and icon-only, then update the components or the doc.

**Compare in Storybook:** Revisit → Icon size in large controls.

Raised while reviewing the iconography guidance (2026-10-22).

## Hot dog's pressed shadow on a black button

**Today:** in hot dog mode, a primary button is now black with a black hard shadow, so the shadow reads as a thicker edge on the bottom and right rather than a separate shape. Pressing still moves the button into it. Secondary buttons, checkboxes, and switches are white or black with the same black shadow.

**Why it's in question:** before, the shadow stood out against a ketchup button. Hot dog mode is the one place where the brand is the joke, so a ketchup or mustard shadow could bring the theme's color back to its controls without making them brand-colored.

**To decide:** look at hot dog buttons pressed and at rest. If the press doesn't read, try a ketchup shadow under black buttons only (a `shadow` token change in hot dog), and check it on a ketchup `brand` band.

Raised while making components neutral (2026-10-27).

## Clicking a link in a checkbox's or switch's label changes it

**Today:** a link inside a Checkbox's or Switch's label (`<Checkbox>I accept the <a href="/terms">terms and conditions</a></Checkbox>`) is styled like every link in a component, `ink` and underlined, but clicking it also ticks the box or turns the switch on, as well as following the link. A unit test confirmed it for both (2026-11-04). Radio's row works the same way, so it probably does too; not checked yet. In a native `<label>`, clicking a link inside it only follows the link: the browser skips the label's own action for interactive content. Base UI's label handles the click itself, so that doesn't happen here.

**Why it's in question:** someone who clicks "terms and conditions" to read them has accepted them without meaning to, and a screen reader user isn't told. Accepting terms is the most common reason to put a link in a checkbox label.

**To decide:** whether a choice control ignores clicks that start on a link or other interactive element inside its label (and how: checking the click's target in the label's click handler, or keeping the link outside the label), and whether Radio needs the same fix. Write the failing test first: click the link, and the box stays unticked. The Checkbox "Link in label" story is the place to show it.

Raised while making links inside components neutral (Q3, 2026-11-04).

## A text field for codes and IDs

**Today:** numbers that are quantities or money get a NumberField, built on Base UI's NumberField (planned, Q7). Input has no `inputMode` guidance and no numeric type: `type` allows text, email, password, search, tel, and url.

**Why it's in question:** some numbers aren't quantities: a verification code, a postcode, an account or card number. They can start with 0, shouldn't step up and down or get thousands separators, and still want the phone's number keyboard. GOV.UK uses a text input with `inputmode="numeric"` for these rather than `type="number"`. Input already passes `inputMode` through, so this may only need guidance, not a new component.

**To decide:** when a page first needs one: whether to document `<Input inputMode="numeric" autoComplete="one-time-code">` (and `spellCheck={false}`, `pattern`) as the pattern for codes and IDs in `docs/brand/forms.md`, or add something dedicated, such as a one-time-code field with a box per digit.

Raised while deciding date and number fields (Q7, 2026-11-04).

## Showing whether a hidden input is checked in the live HTML view

**Today:** the How it works pages' live HTML view (`src/how-it-works/Inspect.tsx`) shows the attributes in the page. For a checkbox, radio, or switch, the hidden `<input>` that forms read keeps the `checked` attribute it started with. Whether it's checked now is a property the browser keeps, which never appears in the HTML, so the view can't show it. The Switch and Radio group pages explain this in words.

**Why it's in question:** the hidden input is what a form sends, so watching it change would make the pages clearer. But the view's promise is "the HTML it renders now", and a property isn't HTML.

**To decide:** whether to show live properties (`checked`, and maybe `value` for text fields) next to the attributes, marked so they can't be mistaken for HTML, or to keep the view to real HTML and leave the explanation to the pages.

Raised while writing the components' How it works pages (2026-10-28).

## A separator screen readers skip

**Today:** every `Separator` is announced as "separator", with no way to hide one. Its label's words are always hidden.

**Why it's in question:** when the groups on both sides already have headings or are separate lists, the line adds nothing for a screen reader, and "separator" is a little extra noise. Fluent and Material hide a purely visual divider. We announce it because one extra word costs little, while hiding the only sign of a break loses it.

**To decide:** if real pages show many separators between groups that are already marked, add a `decorative` prop that hides it (`aria-hidden`), off by default. Adding it doesn't break anything. If not, delete this entry.

Raised while building Separator (2026-11-05).

## A color prop on Badge

**Today:** Badge has four tones (`neutral`, `success`, `warning`, and `danger`) and no other colors. Components are neutral, and a status color is only for a status that means something.

**Why it's in question:** some badges name kinds rather than states (a team, a category, a label someone made), and an app may want them told apart by color as well as words. Most systems offer this: Carbon has 12 colors, Atlassian's Lozenge has accent colors, and Primer's issue labels take any color.

**To decide:** whether to add a `color` prop, and what it takes. Named colors as tokens, each a fill and words pair checked for contrast in every theme, keep the contrast promise; they'd be the one place a component uses palette hues, so `CLAUDE.md` and `color.md` would need an exception. A free CSS color can't be checked and can't change with the theme. This ties in with the categorical palette `color.md` says waits for a chart that needs one.

Raised while building Badge (2026-11-05).

## How faint Skeleton's shapes are

**Today:** Skeleton's shapes are the light `track` gray, with no visible edge outside hot dog mode. Measured against the page, that's about 1.13:1 on `bg` and 1.19:1 on `surface` in light, 1.33:1 and 1.14:1 in dark, and 1.18:1 and 1.19:1 in hot dog (with a thin ink edge there), and lower at the pulse's faintest point (1.06–1.13:1). `tokens/contrast.json` has no pair for it, since the shapes are treated as decorative.

**Why it's in question:** the label is only heard, never shown, so for someone who can see, the shapes are the only sign that something is loading. Someone with low vision may not see them at all, especially on `surface` in dark mode. Adrian Roselli argues for 3:1 (WCAG 1.4.11). Most systems (Polaris, shadcn, MUI) are as faint as this, and a page of 3:1 shapes would look heavy.

**Also the track of Meter and Progress:** the same `track` gray, under a fill that does meet 3:1 against it (`contrast.json` checks that). A Meter always shows its amount in words, so the track's faint far end doesn't hide anything. A Progress with `hideLabel` has only the bar to show how far along it is, and its far end is as faint as a skeleton.

**To decide:** look at real pages of skeletons, meters, and progress bars in all three themes. If the shapes or tracks are too easy to miss, give the shapes a visible edge (`border-strong` reaches 3:1) or a darker fill, add the pairs to `contrast.json`, and update `loading.md`. If not, delete this entry.

Raised while building Skeleton (2026-11-05).

## A done look for Progress

**Today:** a Progress at its maximum looks the same as any other: a full gray bar. Base UI marks it `data-complete`, but nothing styles it. The page changes the label ("Uploaded resume.pdf"), which is announced, or replaces the bar with the result.

**Why it's in question:** Carbon and Atlassian turn a finished bar green with a check, so it's clear at a glance that the task worked. Sherbet leaves that to the page for now, because a full bar can also mean "done, but something went wrong", and a success color shouldn't appear without words that say so.

**To decide:** once a real app uses Progress, see whether pages keep adding their own "done" message. If they do, add a done look (a `success` fill and a check, with words), driven by `data-complete`. If not, delete this entry.

Raised while building Progress (2026-11-06).

## One stylesheet for every component

**Today:** apps import the whole `styles.css`: the tokens, base styles, and every component's CSS in one file (66 KB, about 15 KB gzipped, with 14 components). JavaScript is tree-shaken: an app that imports only Button bundles only Button's code and the Base UI parts it uses (about 4 to 5 KB gzipped with Vite or esbuild, against about 25 KB for everything), because the package is one ES module marked side-effect free. CSS isn't, so an app that uses only Button still loads Meter's styles.

**Why it's in question:** the stylesheet grows with every component, and a small app pays for all of them. One file is simple, though: one import, and the layer order is always right.

**To decide:** when the system has many more components, or an app's CSS size starts to matter, measure `styles.css` again and choose:
- **Keep one file**, if it's still small next to the app's own CSS.
- **A file per component** (`design-system/button.css`), imported by the app next to the component, plus a shared file for the tokens, base styles, and `src/internal/` CSS. Smaller, but the app has to remember each import, and the `@layer` order still has to be declared first.
- **Each component imports its own CSS** from its JavaScript, so the CSS comes with the component automatically. The app's bundler has to handle CSS imported from `node_modules`, which server-rendered setups often need extra configuration for.

Raised after checking tree shaking (2026-11-12).

## A read-only NativeSelect

**Today:** NativeSelect has no `readOnly` prop, and drops it if passed anyway. To show a value that can't be changed, a page uses `disabled` (dimmed, skipped by Tab, and not submitted) or shows the value as text. Every other form control has a read-only state, with the "Read only" note beside its label.

**Why it's in question:** browsers ignore `readonly` on a `<select>`: the value still changes and is submitted. Chromium doesn't expose `aria-readonly` on a select either, so screen readers wouldn't hear it. Blocking the keys and clicks ourselves (Carbon's way) hand-rolls keyboard handling, misses typing a letter and phones' pickers, and still isn't announced.

**To decide:** when an app needs a read-only select, build it by rendering a read-only text field in its place: the chosen option's words in the same box, with no arrow, the "Read only" note, and a hidden input that submits the value. The design was worked out on 2026-11-12: the component keeps its own copy of an uncontrolled value, so turning read-only on shows what was last picked; `ref` points at the hidden input, so form libraries read the value, not the words; and `Field.Root` doesn't get `name` while read-only, because Base UI copies it onto the control and the words would be submitted too. Or wait, if browsers start honoring `readonly` on a select.

Raised while building NativeSelect (2026-11-12).

## Styling a select's open list

**Today:** NativeSelect styles the closed field and leaves the open list to the browser: the system's own menu on macOS and phones, and the select's colors on Windows and Linux. In hot dog mode, the open list isn't ketchup and mustard.

**Why it's in question:** Chromium supports `appearance: base-select`, which lets CSS style the open list and its options so they match the system. Safari and Firefox don't support it yet, so the list would look different in each browser.

**To decide:** when Safari and Firefox support `base-select`, try it on NativeSelect in a Revisit comparison story, and check the keyboard, screen readers, and phones still behave as a native select does.

Raised while building NativeSelect (2026-11-12).
