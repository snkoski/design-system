# Proposed roadmap: the design system and the job tracker

A plan for growing the design system to cover everything the job tracker (`~/Development/job-tracker`) uses, then moving the job tracker onto it. It comes from a review of both codebases (2026-10-29 and 2026-10-31) and was written down on 2026-11-04.

This file exists in two places: `design-system/docs/proposed-roadmap-job-tracker.md` and `job-tracker/proposed-roadmap-job-tracker.md`. The design system's copy is the one to edit. Copy it to the job tracker after every change so the two stay the same.

## The rule

**Answer every open question in this file before starting any new component.** The font trial planned for early November 2026 can go first, since it doesn't add a component. After that, settle the questions, then build.

When a question is decided:

1. Change its status here to "Decided", with the date and the answer in one or two sentences.
2. Move the outcome where the design system keeps its rules (`CLAUDE.md` or `docs/brand/`), as with any decision.
3. If the question also has an entry in `docs/revisit.md`, delete that entry and its comparison story, as `revisit.md` says to.
4. Copy this file to the job tracker.

## Open questions

The "Blocks" column says what can't be built well until the question is answered, which helps pick the order. All of them still need an answer before any new component starts.

| # | Question | Blocks | Status |
| --- | --- | --- | --- |
| Q1 | Shared CSS for form controls | Every new form control | Decided |
| Q2 | Where a field's error goes | Every new form control | Decided |
| Q3 | Brand colors near components (`link`, `highlight`) | Badge, Tag, Breadcrumbs, any link inside a component | Decided |
| Q4 | A danger style for buttons | AlertDialog, every delete in the job tracker | Decided |
| Q5 | Color transitions and the "transform and opacity only" rule | Every new component's CSS | Decided |
| Q6 | Status colors and a categorical palette | Badge, the job tracker's StatusBadge, chart colors | Decided |
| Q7 | Date and number fields | NumberField, a date field | Decided |
| Q8 | Links inside a router | Breadcrumbs, side navigation, any component that renders a link | Decided |
| Q9 | A layouts tier where brand colors are allowed | AppShell, PageHeader | Decided |
| Q10 | Is a native select allowed? | NativeSelect | Decided |
| Q11 | How read-only fields look | Read-only states of every new form control | Decided |
| Q12 | A field that re-checks on blur can make the submit button miss a click | New form controls' demos, the job tracker's form settings | Decided |

### Q1. Shared CSS for form controls

**Decided (2026-11-04):** shared base classes, the way `FieldError` is shared. What form controls have in common is in `src/internal/`: `field.css` (labels and descriptions), `text-field.css` (Input and TextArea), `choice.css` (Checkbox, Radio, and Switch), and `choice-group.css` (CheckboxGroup, RadioGroup, and SegmentedControl). Each part carries the shared class next to its own, and each component's CSS keeps only what's different. Nothing looks different: every story's screenshot, and every form control's computed styles at rest, hovered, pressed, and focused, in normal and forced colors, match the build before. NativeSelect, NumberField, and a date field will use `text-field`. Recorded in `CLAUDE.md` (Form controls, "Shared CSS") and `docs/brand/building.md`.

### Q2. Where a field's error goes

**Decided (2026-11-04):** the error goes between the label (and description) and the control, as GOV.UK and USWDS do, so it's read before the field and a phone keyboard or autofill menu can't cover it. It starts with a visually hidden "Error:", so a screen reader can tell it from the description, and its icon is a warning triangle. A single checkbox or switch, whose label sits beside it, shows its error above the whole row. Every form control and the RichText experiment do this through the shared `FieldError`. Recorded in `docs/brand/forms.md`, `docs/brand/industry.md`, and `CLAUDE.md`. Could be looked at again once real forms use it, if errors under the field turn out to work better.

### Q3. Brand colors near components

**Decided (2026-11-04):** neutral versions inside components, for now. A link inside a component (a breadcrumb, a terms link in a checkbox label) is `ink` and underlined; a tag or chip is gray. `link` and `highlight` stay brand colors for the page around components, and `pnpm check` now fails if a component uses `link`, `highlight`, or `on-highlight`. Form controls already style any link in their label, description, or error this way (`src/internal/field.css`). Badge colors are part of Q6. More color can come back later, once the components are built. Recorded in `docs/brand/color.md`, `tokens/tokens.json`, and `CLAUDE.md`.

### Q4. A danger style for buttons

**Decided (2026-11-04):** a light danger style, built. Button takes `tone="danger"` on `secondary` and `ghost` buttons with label text: red words, icon, and edge (no fill), filling `danger-soft` on hover. It needs no new tokens. The props type won't take it on a primary or icon-only button. Delete buttons and a destructive confirm dialog's final button are `secondary` with `tone="danger"`, and the label names what will be lost. A filled red primary can come later if a page needs one. Recorded in `docs/brand/buttons.md` and `docs/brand/industry.md`.

### Q5. Color transitions

**Decided (2026-11-04):** keep the color fades and change the rule. Movement, entrances, and exits animate only `transform` and `opacity`; a control's state change may also fade `color`, `background-color`, `border-color`, and `box-shadow` over `--duration-fast`, with the properties listed and never `all`. Layout properties never animate. Recorded in `docs/brand/motion.md` and `CLAUDE.md`.

### Q6. Status colors and a categorical palette

**Decided (2026-11-04):** status tones only, mostly gray, for now. Badge takes a `tone` (`neutral`, the default, `success`, `warning`, or `danger`), drawn with the status colors and their soft versions. In the job tracker, offer is `success`, rejected is `danger`, and saved, applied, phone screen, technical, onsite, and withdrawn are `neutral`: their words tell them apart. No categorical palette yet: the job tracker's charts are one color each, so it waits until a chart needs more than one. When Badge is built, consider also letting it take a color for cases that need one (an idea to look at then, not decided: it would let a page bring color back without changing the components' neutral default). Recorded in `docs/brand/color.md`.

### Q7. Date and number fields

**Decided (2026-11-04):** a NumberField and a DatePicker.

- **Numbers:** NumberField, on Base UI's NumberField, using the shared text-field CSS. Its value is a number (or `null` when empty) through `onValueChange`, it can format as you type (currency, thousands), and the arrow keys step it. Input still has no `type="number"`. A text field with `inputMode="numeric"` for codes and IDs is a separate open question in `docs/revisit.md` ("A text field for codes and IDs").
- **Dates:** a DatePicker following shadcn's Base UI date picker: Base UI's Popover with a calendar from React DayPicker, plus a text field so the date can be typed as well as picked. It submits `yyyy-mm-dd` like a native date field, and keeps dates as date-only strings so time zones can't shift them. Every day is at least `--target-min` (44px on touch). Input still has no `type="date"`. Adds React DayPicker and `date-fns` as dependencies; check the package name and version when installing (the DayPicker site now shows version 10 as `@daypicker/react`, while shadcn imports `react-day-picker`).

Recorded in `CLAUDE.md` (the Base UI rule now allows a well-tested library where Base UI has nothing, such as React DayPicker for a calendar) and `docs/brand/forms.md`.

### Q8. Links inside a router

**Decided (2026-11-04):** plain links, and links passed in as children. Tested first: `createLink(ButtonLink)` with TanStack Router 1.170 renders a real `<a>` with the right `href` and ButtonLink's look, navigates without a reload, sets `aria-current="page"` on the current page, passes the ref to the `<a>`, and leaves Cmd-click to the browser; `to` is type-checked. So the job tracker wraps ButtonLink once and needs nothing from the design system. Rule: a component that is one link renders a plain `<a>`, spreads its props, and accepts a `ref`; a component with several links (Breadcrumbs, side navigation, pagination) takes them as children. No router code and no link provider in the system. ButtonLink's tests now check every prop a router adds passes through. Recorded in `CLAUDE.md` ("Links and routers") and `docs/brand/buttons.md`.

### Q9. A layouts tier where brand colors are allowed

**Decided (2026-11-04):** no layouts tier for now. AppShell and PageHeader are ordinary components in `src/components/`, neutral like everything else, with the same rules and checks. An app that wants its brand in the shell sets it with its own CSS on the wrapper (a `brand` or `surface-tint` background), and the components inside stay neutral. If brand color should be built in later, allowing brand tokens for those few files would turn this into a layouts tier. Recorded in `CLAUDE.md` and `docs/brand/color.md`.

### Q10. Is a native select allowed?

**Decided (2026-11-04):** both. NativeSelect renders a real `<select>` through `Field.Control`, like TextArea, and is the default for forms: the browser provides its keyboard and ARIA, phones open their own picker, and it submits with any form. Base UI's Select is for options that need more than plain text (icons, a second line). CLAUDE.md's "built on Base UI" rule now says a native `<input>`, `<textarea>`, or `<select>` in `Field.Control` counts. Recorded in `CLAUDE.md`, `docs/brand/accessibility.md`, and `docs/brand/forms.md`.

### Q11. How read-only fields look

**Decided (2026-11-04):** a "Read only" note with a lock beside the label, and nothing dims. It says it in words, works the same on every control (RichText included), and keeps every value at full contrast. It's hidden from screen readers, which already announce read-only. A group shows it once, beside its label; a whole read-only form repeats it on every field, which is fine for now. Every form control and the RichText experiment do this through the shared `ReadOnlyNote`. Recorded in `docs/brand/accessibility.md` and `CLAUDE.md`. The job tracker has no read-only fields yet, so look at it again when one is needed. **Exception (2026-11-12):** NativeSelect has no read-only state yet, because browsers ignore `readonly` on a `<select>` and screen readers aren't told; see `docs/revisit.md`.

### Q12. A field that re-checks on blur

**Decided (2026-11-04):** validate on submit, then re-check each field as it changes, and never on blur. The error clears as soon as it's fixed, before anyone reaches for the button. This is react-hook-form's default (`mode: "onSubmit"`, `reValidateMode: "onChange"`), so the job tracker needs no change. Recorded in `docs/brand/forms.md` and `CLAUDE.md`; the Input and TextArea demos now re-check on change. Also decided: components never depend on a form library or validate for themselves. They take `invalid` and `error`, so any library, or none, can drive them (CLAUDE.md, Form controls).

## What already exists

Compared with the first version of this roadmap (2026-10-29), the design system already has:

| Planned | In the design system |
| --- | --- |
| Tokens: semantic colors, spacing, radius, type, shadow, motion, and focus | Done, with three themes, touch and compact sizing, and contrast checks |
| An icon system | Decided: Lucide icons, passed in as `iconStart` and `iconEnd`. No wrapper component needed |
| A headless layer | Decided: Base UI |
| Button, IconButton, and a loading state | Done: `Button`, with `iconOnly` (its types require an `aria-label`) and `loading` |
| Spinner | Done (2026-11-05): `Spinner`, with a required `label`, `hideLabel`, three sizes, and `delay`. Button's loading state shares its drawing |
| Text links and router links | Partly done: `ButtonLink` renders a real `<a>`, and `base.css` styles plain links. See Q8 |
| Input and Textarea | Done: `Input` and `TextArea` |
| Label, FieldError, and a Field component | Done differently: each control takes `label`, `description`, and `error` props, so no separate Field component is needed |
| Checkbox and Switch | Done, plus `CheckboxGroup` and `RadioGroup` |
| SegmentedControl | Done. It covers the job tracker's Table and Kanban switch |
| ProgressBar | Done (2026-11-06): `Meter` for "topics done", and `Progress` for tasks under way |
| Select | Done (2026-11-12): `NativeSelect`, a real `<select>` with its options as an `options` array. No read-only yet (see Q11). A custom-drawn `Select` comes later, only if options need more than text |

## Changes from the first version

| First version said | Now | Why |
| --- | --- | --- |
| A `cn()` and tailwind-merge rule so caller classes always win | Dropped | CSS layers do this, and `className` is for layout only |
| A `tone` prop on Badge | Keep the prop, render it as `data-tone` | Variants are `data-*` attributes; no cva or modifier classes |
| A "link" button variant for "Edit" and "Show content" | `ghost`, size `sm` | `docs/brand/buttons.md` lists "Edit" and "Show more" as ghost |
| A quiet red delete button | A button whose label names what's lost, behind a confirm dialog | `buttons.md`'s guidance for destructive actions. See Q4 |
| A Field component | Removed | Each control has its own label, description, and error |
| A small Input and Select for filter bars | `data-density="compact"` on the toolbar or table | Text fields never go below `--target-min`; compact density is how they shrink |
| A star rating made of buttons | Rating built on RadioGroup, the way SegmentedControl is | It's one choice out of five, so it gets radio behavior for free |
| A separate toggle chip component | CheckboxGroup drawn as chips, or Base UI's ToggleGroup | The same idea as SegmentedControl, for choosing several |
| ProgressBar | Base UI's Meter for "topics done", Progress for loading | Completion is a measurement, not a task in progress |
| Rebuild the topic status button that cycles ○ ◐ ● | Use a three-option SegmentedControl or a select | A button that cycles through states is hard to understand and doesn't announce what it does |
| A layouts tier for AppShell and PageHeader | Ordinary, neutral components; the app adds its brand around them with its own CSS | Decided in Q9: no brand colors inside components, for now |
| A Prose component for Markdown | Pair it with the RichText experiment | The job tracker's notes editor could use RichText, and the read view needs a matching prose style |

## Build order for the design system

Start only after the open questions are answered.

### Phase 1: small pieces

1. **Spinner.** Done (2026-11-05). The drawing moved out of `Button/shared.tsx` into `src/internal/`, and Button and the new `Spinner` share it. It has a required `label`, `hideLabel`, three sizes, and `delay`. See `docs/brand/loading.md`.
2. **Separator.** Done (2026-11-05). On Base UI, rendered as an `<hr>`: horizontal or vertical, always announced, with an optional plain-text label (such as "or") on a horizontal one. See "Separating content" in `docs/brand/layout.md`. The job tracker has no standalone separator, so it adds no migration step: its lines are list rows, card edges, and the app shell's borders, which List, Table, Card, and AppShell will draw.
3. **Badge.** Done (2026-11-05). A `tone` (`neutral`, the default, `success`, `warning`, or `danger`) as `data-tone`, an optional `icon` before the words, and two sizes (`sm` and `md`). A status tone is a soft fill with its words in the tone's color. No color prop yet: see `docs/revisit.md`. See `docs/brand/badges.md`.
4. **Skeleton.** Done (2026-11-05). `Skeleton` is the loading area, with a required `label` (announced, never shown) and `delay`, like Spinner; `SkeletonItem` is one shape: `text` (with `lines`), `box`, or `circle`. The shapes pulse, chosen over a shimmer after comparing the two side by side (2026-11-06). See `docs/brand/loading.md`.
5. **Meter and Progress.** Done (2026-11-06). Both on Base UI, sharing one look (`src/internal/bar.css`): a label and value over a rounded track, `sm` (4px) or `md` (8px). `Meter` is an amount ("Topics done, 12 of 20"), with a `tone`; `Progress` is a task, with `value={null}` for an unknown length, `hideLabel`, and `delay`, announced once like Spinner. See `docs/brand/meters.md` and `docs/brand/loading.md`.

### Phase 2: more form controls

1. **NativeSelect** (Q10). Done (2026-11-12). It renders a `<select>` through `Field.Control`, like TextArea, with the shared text-field look, our own arrow, and Input's two sizes. Options are an `options` array of `{ value, label }` and groups; `placeholder` adds an empty first option that stays choosable. No `readOnly` or `multiple`. A dev warning fires when the value matches no option. See `docs/brand/choices.md`. The job tracker has 33 selects, so this is the biggest single step in its migration.
2. **NumberField**, on Base UI (Q7).
3. **DatePicker**: a text field and a calendar button, the calendar from React DayPicker in Base UI's Popover, following shadcn's Base UI date picker (Q7).
4. **FileInput**: a real `<input type="file">` with a label.
5. **Rating**, built like SegmentedControl on RadioGroup.
6. **A chip group**, built on CheckboxGroup or ToggleGroup.
7. **ErrorSummary.** `docs/brand/forms.md` already asks for one when a form has two or more errors, and none exists yet.

### Phase 3: showing and hiding content

1. **Card.**
2. **Tag**, which can be removed, built from Badge and a ghost icon-only Button.
3. **Collapsible and Accordion**, on Base UI.
4. **Tabs**, on Base UI.
5. **Table**: plain CSS, works with compact density, and `aria-sort` on sortable headers.
6. **Stat**, a label and a large number.
7. **EmptyState.**
8. **List**, rows divided by lines.
9. **Tooltip**, on Base UI.
10. **Breadcrumbs** (Q3, Q8).

### Phase 4: overlays

1. **Dialog.**
2. **AlertDialog**, to confirm deletes (Q4). It replaces the job tracker's `window.confirm`.
3. **Drawer**, on Base UI, for the small-screen side navigation.
4. **Popover.**
5. **Select and Combobox**, on Base UI, including choosing several with Tags, for the job tracker's topic picker.
6. **Toast.**
7. **Menu.**

### Phase 5: page structure (Q9: ordinary, neutral components)

1. **AppShell**: side navigation and top bar, using Drawer on small screens. Neutral; the app can give the wrapper a brand background with its own CSS.
2. **PageHeader**: title, description, and actions.
3. **Toolbar or filter bar**: Base UI's Toolbar with compact density.
4. **Prose**: styles for rendered Markdown.
5. **Timeline.**

### Phase 6: stays in each app

These are specific to the job tracker and become thin pieces built from the design system:

- **StatusBadge**: maps each application status to a Badge tone (Q6): offer is `success`, rejected is `danger`, and the rest are `neutral`, told apart by their words.
- **Chart colors**: recharts reading the design system's CSS variables.
- **Kanban board and the sortable resource list**, on dnd-kit. The design system says anything done by dragging also works with a click. The board has the status select for that. Check whether the resource list can be reordered without dragging; if not, add move up and move down buttons.
- **ApplicationForm, JobDescriptionView, QuestionCard, TopicNode, VersionRow, and ResearchSection**: rebuilt from the components above.

## Migration order for the job tracker

### Before starting

- **Don't import `tailwind-theme.css` until the end.** It switches off Tailwind's color, font, radius, and shadow utilities, which would break every page not yet moved over. Import only `styles.css` while migrating. Its layer order matches Tailwind 4's, so the two work together.
- **Set `data-theme="light"` on `<html>` while migrating.** Otherwise design system components follow the computer's dark mode while the job tracker's hard-coded white surfaces stay light.
- **Choose the font on purpose.** The job tracker uses Inter and the design system uses Geist, and the font trial may change the design system's font again.
- **Install the package.** It's private and named `design-system`. Link it locally (`"design-system": "link:../../design-system"` in `apps/web/package.json`) or install it from git, where the `prepare` script builds it.

### Order

1. **Buttons.**
   - Replace the 32 `Button`s and about 14 plain text buttons ("Edit", "Show content", "Remove") with primary, secondary, and ghost Buttons.
   - Replace `disabled={isPending}` on submit buttons with `loading`. `forms.md` says never to disable submit.
   - Add the `createLink(ButtonLink)` wrapper (Q8).
2. **Text fields.**
   - `<Label>`, `<Input>`, and `<FieldError>` together become `<Input label error invalid>`.
   - Add a small helper in the job tracker that turns a react-hook-form error into `{ invalid, error }`.
   - Fields that use a placeholder as their label need an `aria-label` (the types catch these). Copy also changes: "(optional)" on optional fields, and no colons in labels.
   - Keep react-hook-form's default validation timing (Q12).
3. **Choice controls.**
   - Table and Kanban become a `SegmentedControl`.
   - "Needs review only" becomes a `Checkbox` or `Switch`.
   - Competencies become a `CheckboxGroup`, until the chip group exists.
   - Base UI controls need react-hook-form's `Controller` instead of `register`. Only ApplicationForm uses react-hook-form, so this is small.
4. **NativeSelect**, for all 33 selects.
5. **Spinner**, for the 18 text-only `<Spinner />` placeholders. Each gets a `label` that says what's loading ("Loading applications…"), and the space around it keeps its padding and centering with Tailwind. Don't put it inside an `aria-busy` element (`docs/brand/loading.md`). Some list areas may suit Skeleton better: `docs/brand/loading.md` says when to use which.
6. **Card, Badge, Meter, Table, Collapsible, Tabs, and Rating**, a page at a time. `ProgressBar` becomes a `Meter` with `valueText` ("12 of 20").
7. **AlertDialog** replaces `DeleteButton` and the other `window.confirm` calls. Then **Drawer and AppShell** replace `Layout.tsx`.
8. **Turn on `tailwind-theme.css`.** Fix any Tailwind color classes that are left, then delete `apps/web/src/components/ui` and the job tracker's `cn()` and tailwind-merge.

## Visual tests

Chromatic has been paused since 2026-10-27 (see the design system's `CLAUDE.md`). Turn it back on with `gh workflow enable Chromatic` before components start replacing parts of a real app, because that's when visual differences matter most.

## Reference: what the job tracker uses today

From the review of `apps/web/src` on 2026-10-29.

**Basic components** (`components/ui/index.tsx`): `Card` and `CardBody` (48 uses each), `Label` (45), `Input` (40), `CardHeader` (37), `Select` (33, native), `Button` (32), `Badge` (14), `Textarea` (12), and `FieldError` (4).

**Shared components** (`components/shared/`): `PageHeader` (19), `Spinner` (18, text only), `Breadcrumbs` (11), `EmptyState` (7), `StatusBadge` (5), `DeleteButton` (2, uses `window.confirm`), `ProgressBar` (1), and `Markdown` with mermaid diagrams (3).

**App shell** (`components/Layout.tsx`): sidebar, navigation links, top bar on small screens, a drawer with an overlay, and two inline SVG icons.

**Patterns built inline, with no component yet:**
- About 8 text-style buttons ("Edit", "Show content").
- About 6 quiet delete buttons.
- A Table and Kanban switch.
- Tabs on the track page.
- A star rating, copied three times.
- A status button that cycles.
- Toggle chips and removable tags.
- Four separate expand and collapse sections.
- Two data tables with the same header styles.
- Lists divided by lines, and a timeline.
- A stat tile.
- A plain checkbox and a plain file input.
- A long select of topics that should be searchable.
- Filter bars.
- `title` attributes used as tooltips.
- Inline SVG and Unicode characters used as icons.

**Libraries:** recharts (two bar charts), dnd-kit (a sortable list and the kanban board), and react-markdown with mermaid.

**Input types in use:** date (4), number (4), email (1), tel (1), file (1), and checkbox (1).
