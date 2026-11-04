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
| Q1 | Shared CSS for form controls | Every new form control | Open |
| Q2 | Where a field's error goes | Every new form control | Open |
| Q3 | Brand colors near components (`link`, `highlight`) | Badge, Tag, Breadcrumbs, any link inside a component | Open |
| Q4 | A danger style for buttons | AlertDialog, every delete in the job tracker | Open |
| Q5 | Color transitions and the "transform and opacity only" rule | Every new component's CSS | Open |
| Q6 | Status colors and a categorical palette | Badge, the job tracker's StatusBadge, chart colors | Open |
| Q7 | Date and number fields | NumberField, a date field | Open |
| Q8 | Links inside a router | Breadcrumbs, side navigation, any component that renders a link | Open |
| Q9 | A layouts tier where brand colors are allowed | AppShell, PageHeader | Open |
| Q10 | Is a native select allowed? | NativeSelect | Open |
| Q11 | How read-only fields look | Read-only states of every new form control | Open |
| Q12 | A field that re-checks on blur can make the submit button miss a click | New form controls' demos, the job tracker's form settings | Open |

### Q1. Shared CSS for form controls

Already in `docs/revisit.md`. Input's styles are copied into TextArea today, and the choice controls repeat each other's CSS. The next form controls on the plan (NativeSelect, NumberField, a date field, Select, and Combobox) would make that two copies into six. Extract a text-field base (and a choice-control base) into `src/internal/` first, the way `field-error.css` is shared now.

### Q2. Where a field's error goes

Already in `docs/revisit.md`. Moving the error changes every form control and `FieldError`. Settle it before the number of form controls roughly doubles.

### Q3. Brand colors near components

Already in `docs/revisit.md`. Badge, Tag, and Breadcrumbs are the first components that would carry `link` or `highlight` into a component. Choose between keeping them as brand colors set by the site, neutral versions for components, or status colors only on badges.

### Q4. A danger style for buttons

Already in `docs/revisit.md`. The job tracker deletes things on six or more screens, and the confirm dialog's confirm button needs an answer: a `tone="danger"` prop with new tokens, or `secondary` plus a label that names what's lost.

### Q5. Color transitions

Already in `docs/revisit.md`. The written rule says to animate only `transform` and `opacity`, but every component fades its colors. Every new CSS file will either follow the rule or not, so settle it once.

### Q6. Status colors and a categorical palette

New. The tokens have `success`, `warning`, and `danger`, with soft versions. The job tracker has eight application statuses (saved, applied, phone screen, technical, onsite, offer, rejected, and withdrawn), each with its own color today, plus bar charts.

Options:
- Add an `info` or `neutral` badge tone and accept that most statuses stay gray (offer is success, rejected is danger, and the rest are neutral).
- Add a categorical palette for data visualization only, which keeps components neutral.
- Both.

Status text plus an icon already satisfies "color never carries meaning alone", so this is about how statuses look, not whether they're accessible.

### Q7. Date and number fields

New. `Input`'s `type` allows only text-like types, so there is no `date` or `number`. The job tracker uses each four times (follow-up dates, salary, and so on).

- Numbers: Base UI has NumberField. Build it on Q1's shared text-field base.
- Dates: either allow `type="date"` on Input (the browser's own picker, which is accessible and good on phones, but styled differently in each browser) or build a DateField. Base UI has no date picker.

### Q8. Links inside a router

New. `ButtonLink` renders a plain `<a>`. In an app with client-side routing (the job tracker uses TanStack Router), a plain `<a>` reloads the whole page.

`ButtonLink` spreads its props onto the `<a>` and accepts `ref`, so wrapping it in the app with TanStack Router's `createLink(ButtonLink)` should work. This hasn't been tested yet; confirm it first.

Then decide the rule for components that render links, for example:
- Every component that renders one link uses a plain `<a>`, spreads its props, and forwards its ref, so any router can wrap it.
- Components with several links inside (Breadcrumbs, side navigation) take the links as children, so the app passes its own router links in.

### Q9. A layouts tier where brand colors are allowed

New. `pnpm check` fails any component that uses `brand` or `surface-tint`, because brand colors belong to the layout around components. But an app shell (side navigation and top bar) and a page header are exactly where the brand should show.

Decide whether to add a tier for them, such as `src/layouts/`, with its own rules in `CLAUDE.md` and `check-rules.mjs`: brand tokens allowed, still tested, still accessible, still published. Or decide that these stay in each app.

### Q10. Is a native select allowed?

New. CLAUDE.md says interactive components such as select are built on Base UI. The job tracker has 33 native `<select>`s, many inside react-hook-form forms, where a native element works with `register` and Base UI's Select needs a `Controller`.

A NativeSelect would render a `<select>` through `Field.Control`, the way TextArea renders a `<textarea>`. That doesn't hand-roll any keyboard handling or ARIA, since the browser provides it, and native selects are the best choice on phones. Decide whether it fits the rule (and say so in CLAUDE.md), or whether every select uses Base UI's Select.

### Q11. How read-only fields look

Already in `docs/revisit.md`. Each control handles read-only differently today. Every new form control needs a read-only state, so pick one cue first.

### Q12. A field that re-checks on blur

Already in `docs/revisit.md`. It affects the forms guidance and new form controls' demos. For the job tracker, react-hook-form's defaults (`mode: "onSubmit"`, `reValidateMode: "onChange"`) already match the "re-check while typing" option.

## What already exists

Compared with the first version of this roadmap (2026-10-29), the design system already has:

| Planned | In the design system |
| --- | --- |
| Tokens: semantic colors, spacing, radius, type, shadow, motion, and focus | Done, with three themes, touch and compact sizing, and contrast checks |
| An icon system | Decided: Lucide icons, passed in as `iconStart` and `iconEnd`. No wrapper component needed |
| A headless layer | Decided: Base UI |
| Button, IconButton, and a loading state | Done: `Button`, with `iconOnly` (its types require an `aria-label`) and `loading` |
| Text links and router links | Partly done: `ButtonLink` renders a real `<a>`, and `base.css` styles plain links. See Q8 |
| Input and Textarea | Done: `Input` and `TextArea` |
| Label, FieldError, and a Field component | Done differently: each control takes `label`, `description`, and `error` props, so no separate Field component is needed |
| Checkbox and Switch | Done, plus `CheckboxGroup` and `RadioGroup` |
| SegmentedControl | Done. It covers the job tracker's Table and Kanban switch |

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
| AppShell and PageHeader as ordinary components | A layouts tier | Components can't use brand colors. See Q9 |
| A Prose component for Markdown | Pair it with the RichText experiment | The job tracker's notes editor could use RichText, and the read view needs a matching prose style |

## Build order for the design system

Start only after the open questions are answered.

### Phase 1: small pieces

1. **Spinner.** Move the private one out of `Button/shared.tsx` and export it. It uses `--duration-loop`.
2. **Separator**, on Base UI.
3. **Badge**, with `data-tone` (Q3, Q6).
4. **Skeleton.**
5. **Meter and Progress**, on Base UI.

### Phase 2: more form controls

1. **NativeSelect** (Q10). It renders a `<select>` through `Field.Control`, like TextArea. The job tracker has 33 selects, so this is the biggest single step in its migration.
2. **NumberField**, on Base UI (Q7).
3. **A date field**, whichever Q7 decides.
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

### Phase 5: layouts, where brand colors are allowed (Q9)

1. **AppShell**: side navigation and top bar, using Drawer on small screens.
2. **PageHeader**: title, description, and actions.
3. **Toolbar or filter bar**: Base UI's Toolbar with compact density.
4. **Prose**: styles for rendered Markdown.
5. **Timeline.**

### Phase 6: stays in each app

These are specific to the job tracker and become thin pieces built from the design system:

- **StatusBadge**: maps each application status to a Badge tone and icon (Q6).
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
5. **Card, Badge, Table, Collapsible, Tabs, and Rating**, a page at a time.
6. **AlertDialog** replaces `DeleteButton` and the other `window.confirm` calls. Then **Drawer and AppShell** replace `Layout.tsx`.
7. **Turn on `tailwind-theme.css`.** Fix any Tailwind color classes that are left, then delete `apps/web/src/components/ui` and the job tracker's `cn()` and tailwind-merge.

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
