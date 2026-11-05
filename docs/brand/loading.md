# Choosing a loading indicator

Show that something is loading only when the wait is long enough to notice. Show it where the loading is, and say what's loading.

## Which one

- **A button's own action** (saving, sending, deleting): the button's `loading` prop. It shows a spinner in the button, keeps the button focusable, and stops a second click. Don't put a Spinner beside it.
- **A page or section waiting for its data**, when you don't know its layout yet: `Spinner`, with a label that says what's loading.
- **A page or section whose layout you know** (a list, a table, a card): a skeleton, a gray outline of the content, is planned (Skeleton, in the roadmap). Until it exists, use a Spinner.
- **A long task whose progress you can measure** (an upload, an import): a progress bar is planned (Progress, in the roadmap). A spinner can't say how much is left.

## Using a Spinner

- **Say what's loading.** "Loading applications…", not "Loading…" or "Please wait." The label is required, ends with an ellipsis, and is visible unless there's no room (`hideLabel`).
- **One per page or section.** Every Spinner announces itself to screen readers. Three loading at once is three announcements. Show one for the whole area instead.
- **Put it where the content will be**, centered in the space, with the layout's own Tailwind classes (`p-8 text-center`). The component sets no margin or width.
- **Don't put the Spinner inside an `aria-busy` element.** Screen readers may hold back what a busy element announces until it's no longer busy, and by then the Spinner is gone. If you mark an area busy, keep the Spinner outside it, next to it.
- **Use `delay` for loads that are often quick.** A spinner that flashes for a moment is noise. With `delay={400}`, a load that finishes within 400ms shows nothing; a longer one shows the spinner, which fades in. Primer suggests no loading state under one second; Polaris, under half a second.
- **When it's done, show the content, or say what went wrong.** Don't leave a spinner running after an error.

## Sizes

`sm` (16px) sits inside small text, such as next to a heading or in a toolbar. `md` (20px) is the default, beside body text. `lg` (24px) is for a whole page or a large empty area. The label is small text at `sm` and body text otherwise.
