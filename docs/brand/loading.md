# Choosing a loading indicator

Show that something is loading only when the wait is long enough to notice. Show it where the loading is, and say what's loading.

## Which one

- **A button's own action** (saving, sending, deleting): the button's `loading` prop. It shows a spinner in the button, keeps the button focusable, and stops a second click. Don't put a Spinner beside it.
- **A page or section waiting for its data**, when you don't know its layout: `Spinner`, with a label that says what's loading.
- **A page or section whose layout you know** (a list, a table, a card): `Skeleton`, gray shapes in the content's layout, with a label that says what's loading. The page keeps its shape, and the content drops into place.
- **A long task whose progress you can measure** (an upload, an import): `Progress`, a bar that fills as it goes, with a label that says what's under way. A spinner can't say how much is left. For an amount that isn't a task, such as storage used, use a Meter (see "Choosing a meter").

## Using a Spinner

- **Say what's loading.** "Loading applications…", not "Loading…" or "Please wait." The label is required, ends with an ellipsis, and is visible unless there's no room (`hideLabel`).
- **One per page or section.** Every Spinner announces itself to screen readers. Three loading at once is three announcements. Show one for the whole area instead.
- **Put it where the content will be**, centered in the space, with the layout's own Tailwind classes (`p-8 text-center`). The component sets no margin or width.
- **Don't put the Spinner inside an `aria-busy` element.** Screen readers may hold back what a busy element announces until it's no longer busy, and by then the Spinner is gone. If you mark an area busy, keep the Spinner outside it, next to it.
- **Use `delay` for loads that are often quick.** A spinner that flashes for a moment is noise. With `delay={400}`, a load that finishes within 400ms shows nothing; a longer one shows the spinner, which fades in. Primer suggests no loading state under one second; Polaris, under half a second.
- **When it's done, show the content, or say what went wrong.** Don't leave a spinner running after an error.

## Sizes

`sm` (16px) sits inside small text, such as next to a heading or in a toolbar. `md` (20px) is the default, beside body text. `lg` (24px) is for a whole page or a large empty area. The label is small text at `sm` and body text otherwise.

## Using a Skeleton

- **Say what's loading.** Like a Spinner, a Skeleton has a required `label`: "Loading applications…". It's never shown. Screen readers can't see the shapes, so they're hidden, and the label is announced once instead.
- **One per page or section.** Wrap the whole area in one `Skeleton` and put its shapes inside, as `SkeletonItem`s. Each Skeleton announces itself, so three side by side, or one inside another, is more than one announcement.
- **Match the layout that's coming**, with Tailwind classes on the Skeleton and on `<div>`s inside it: `className="grid gap-4"`, a `flex` row for an avatar beside its text. In a `flex` row, a text shape or box has no width of its own: give it `flex-1` or a width class (`w-48`), or it shrinks to nothing. Use `<div>`s rather than a real list or table, which screen readers would announce, empty.
- **Match the text.** A `text` shape takes the height of the text style it's in: give it the same class as the text it stands in for (`text-heading-md`, `text-body`), and set `lines` for a paragraph. The last of several lines is shorter, the way a paragraph ends. Make a short line narrower with a width class (`w-1/2`).
- **Size boxes and circles** with Tailwind: `h-32` for an image, `size-10` for an avatar. A box is as wide as its container, except in a `flex` row (see above).
- **Only for content.** Don't draw skeletons of buttons, fields, menus, dialogs, or messages: show those for real, or wait.
- **Use `delay`** for loads that are often quick, as with a Spinner, and replace the whole Skeleton with the content (or what went wrong) when it's done.
- **Don't add `aria-busy`.** Only one screen reader supports it, and it can hold back what's announced.

## Using a Progress

- **Say what's under way.** "Uploading resume.pdf…", "Importing contacts…". The label is required, shown above the bar, and announced once when the bar appears. When the task finishes, change the label ("Uploaded resume.pdf") and the new words are announced too; or replace the bar with the result.
- **Say how far along it is in words** when a count means more than a percent: `valueText="3 of 10 files"`. Without it, the bar shows a percent. Changes to the value aren't announced, so a screen reader user isn't interrupted at every step; they can find the bar to hear where it's got to.
- **Use `value={null}` while it doesn't know how long,** and a short fill slides across. Switch to a number as soon as there is one: a bar that fills says more than one that slides. For a short wait you'll never be able to measure, use a Spinner instead.
- **One bar for one task.** Each Progress announces itself, so for several files at once, show one bar for the whole batch ("Uploading 3 files…", `valueText="1 of 3 files"`), not a bar per file.
- **Never let it go backwards.** If a task starts over, show a new bar with a new label.
- **Add a description for anything else worth knowing,** such as the time left: "About a minute left." Screen readers read it as the bar's description.
- **`hideLabel` only where there's no room for words,** such as a thin bar along the top edge of a card. Screen readers still hear the label.
- **Use `delay` for tasks that are often quick,** as with a Spinner: a bar that flashes for a moment is noise.
- **Give it a width.** A progress bar is as wide as its container, but in a `flex` row it shrinks to the width of its label and value: add `flex-1` or a width class.
- **When it's done, show the result, or say what went wrong.** A full bar on its own isn't a confirmation, and a failed task needs an error in words, not a stopped bar.

## How it moves

Spinners turn, and skeletons pulse: every shape fades to half and back, together, once every 1.4 seconds. A Progress that doesn't know how long slides a short fill from the start to the end, also once every 1.4 seconds, always forwards; one that does glides from step to step. With reduced motion all three slow down rather than stop, so you can still tell something is happening. The skeleton's shapes are the light gray `track` color, faint on purpose so a page of them doesn't look heavy.
