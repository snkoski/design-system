# Checks by kind of component

Do every row whose first column describes the component. Each row came from a bug a past build shipped or nearly shipped. Rules that already live in `CLAUDE.md` are only pointed at here.

## Research

Do these in Phase 1's throwaway test.

| If it… | Check | Why |
| --- | --- | --- |
| Is one Tab stop (a radio group, a segmented control, tabs) | Press Tab with the chosen item disabled, and with the whole control disabled. | Base UI makes the chosen item the Tab stop; if it can't take focus, Tab skips the whole control (`CLAUDE.md`, Form controls, SegmentedControl). |
| Contains or wraps an existing component (a group of Checkboxes, a field around an Input) | Render them together, not only the bare primitive. Note any change the existing one needs; it goes in the proposal. | Checkbox's own `Field.Root` hid CheckboxGroup's `name`, so the form submitted nothing. |
| Has a single value (a radio group, a select) | Find how a controlled one says "nothing selected", and type `value` so it can. | Base UI's RadioGroup takes `null`; `undefined` makes it uncontrolled. |
| Has no Base UI primitive and renders a Base UI part as another element through `render` | Plan to pass every prop through the Base UI part, and only what it can't take (such as `rows`) on the `render` element (`CLAUDE.md`, Form controls, the TextArea paragraph). | A consumer's `aria-describedby` on the `render` element cut the description and error out of it. |

## Tests

Add these in Phase 3. The ones marked "story" can't run in jsdom: list them for Phase 5.

| If it… | Check | Why |
| --- | --- | --- |
| Leaves an `aria-*` or `data-*` attribute out of its props type | `expectTypeOf<Props>().not.toHaveProperty(...)` (`CLAUDE.md`, Testing). If passing it anyway would break the component, drop it at runtime and test that. | `@ts-expect-error` can't see hyphenated attributes. |
| Depends on CSS or layout (hit areas, `pointer-events`, sizes, position) | Story: a real hit-test with `document.elementFromPoint`, with a mouse and on touch (`CLAUDE.md`, Testing). | jsdom has no layout, and a mouse-only check misses a broken touch hit area. |
| Can have no visible label | Story: its wrapper is at least `--target-min` tall. | One control's hit area hides the gap; stacked unlabelled controls steal each other's clicks. |
| Renders a list from data (options, items, rows) | Follow `NativeSelect`, which takes its options as data. Key each element by a stable id from the data, never its position. In an uncontrolled component, choose an item, rerender with one item added before it and one removed, and check the choice and the form data. Also test that data arriving after the first render doesn't lose a `defaultValue`, or warns if it can. | Keyed by position, React rewrites elements in place and the browser's choice silently moves to another item (NativeSelect's review caught this). |
| Is a form control | A consumer's `aria-describedby` is added to the description and error, not put in their place: the accessible description still includes both. | The usual pass-through test only checks plain attributes. |
| Renders something different once JavaScript runs (state set in an effect, such as Spinner's status region) | Test the server HTML with `renderToString`, attached to `document.body`. Test hydration with `hydrateRoot` inside `act`, a `console.error` spy that stays uncalled, and then the effect's change. Break it on purpose (a module-level counter rendered into an attribute) to see the test catch a mismatch. | jsdom has `window` during `renderToString`, so a `typeof window` check can't tell server from client. |
| Opens a Base UI popup (Popover, Dialog, Menu, Select, Tooltip) | Check focus after opening or closing with `await waitFor(() => expect(...).toHaveFocus())`. | Base UI moves focus a frame later. |

## Look

Do these in Phase 7, after the screenshots.

| If it… | Check | Why |
| --- | --- | --- |
| Has a state that changes an edge or fill (checked, selected, invalid) | Log the computed `backgroundColor` and `borderTopColor` at rest and hovered, in normal mode and in forced colors. Use real hover (`locator.hover()`); a story's `userEvent.hover` doesn't trigger `:hover`. | A hovered "on" Switch lost its fill and hid its thumb in forced colors; a hovered invalid Input lost its red edge. |
| Has any state, in forced colors | At rest, each state's edge or fill must differ from `Canvas`: look for missing boxes and log the colors beside `Canvas`. Read every label in the screenshot too. | A state rule outranks the forced-colors base rule, and an invalid, unticked Checkbox vanished. The Canvas backplate hid a chosen segment's `HighlightText` label (`CLAUDE.md`, Accessibility). |
| Has a rule that dims or colors a state with extra conditions (`:not(:focus-visible)`, `:has(...)`) | Copy the same selector into the forced-colors reset. | The reset was less specific and lost: disabled segments stayed faded. |
| Has a story with a `play` function | Screenshot focus without pressing Tab again. | `play` has already run and may have moved focus. |
| Is a text field | Type a value before screenshotting. Each browser-drawn piece (search clear button, autofill colors, number spinners, password reveal) is themed, hidden, or a choice written down. | They only appear with a value. |
| Renders `<hr>`, `<fieldset>`, or `<legend>` | A story that renders it in a shadow root with only the component's CSS (`CLAUDE.md`, Testing; Separator's `WithoutCssReset`). | Storybook's Tailwind reset hides the browser's own borders and margins. |
| Has text that can wrap | Look at it wrapped at its smallest size, without an icon, and in hot dog. A story checks each line sits inside the rounded edge with `Range.getClientRects()` (Badge's `Wrapping`). | A pill's curve cut into the first and last words, and an icon in the tested case hid it. |
| Renders `ul` or `ol` | Bullets and numbers show. | The base styles remove them. |
| Has a story that isn't `fullscreen` | Screenshot `#storybook-root` or the whole page, not a fixed area. | Storybook centers the component. |
| Lays out `AllThemes` in columns | Each component keeps its own height when a taller neighbor stretches its grid cell. | A grid root spreads its rows apart without `align-content: start`. |
| Dims any part with `opacity` (read-only, disabled) | Blend each color with the page color at that opacity, by hand, and check 4.5:1 for text and 3:1 for edges and meaningful icons, placeholders included. If a dimmed control can still take focus, its outline must still meet 3:1, or restore full opacity on `:focus-visible`. | `pnpm check` only knows undimmed pairs. |
| Can't be clicked or focused (a spinner, a badge) | Skip hit area, focus, hover, and the coarse and compact screenshots, and say so in the report. Still check every theme and forced colors. | There's nothing to target. |
