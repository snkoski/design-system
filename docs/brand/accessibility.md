# Accessibility

These are requirements. A component that breaks one is not done. The baseline is **WCAG 2.2 Level AA**, the level the GOV.UK Design System, Polaris, Fluent, and Carbon all target, with a few AAA rules where they cost little.

## Contrast

- Text meets 4.5:1 on its ground in every theme (3:1 only for text 24px+ or bold 19px+). Each text token's usage note names the grounds it is checked on; use it only on those.
- Borders that someone must see to use a control, focus outlines, and meaningful icons meet 3:1 (WCAG 1.4.11). Use `border-strong` for control edges, not `border`.
- Color never carries meaning alone. Status, selection, errors, and required fields always add an icon, word, or shape.
- Disabled controls are exempt from contrast rules, but avoid disabled buttons where you can (see **Forms**).
- A future high-contrast theme should reach 7:1 for text (WCAG AAA 1.4.6), as Primer's and Apple's high-contrast guidance asks.

## Focus

- Every interactive element shows a visible focus state on keyboard focus (`:focus-visible`).
- Focus is an **outline, never only a box-shadow**: `outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset);`. Shadows disappear in forced-colors mode; outlines do not.
- The 2px outline with a 2px offset also meets WCAG 2.4.13 Focus Appearance (AAA): an outline drawn *outside* the element at 2px covers the required area, where an inset one would need 3px.
- Never remove an outline without replacing it.
- **Focus is never hidden behind sticky content** (WCAG 2.4.11). Sticky headers and footers need `scroll-padding-top` and `scroll-padding-bottom` on the page so focused items scroll into view.
- Focus order follows reading order. Dialogs and menus trap focus while open and return it to the trigger on close (Base UI does this; don't override it).
- After deleting something, move focus to a sensible neighbor, never to the top of the page.

## Targets

- Every interactive element's hit area is at least `target-min`: 24px with a mouse (WCAG 2.5.8, AA) and 44px when a touch screen is present (WCAG 2.5.5, AAA). See **Mouse, touch, and screen size**.
- Separate small targets are at least `target-gap` (8px) apart.
- Links inside a sentence are exempt from target size, but keep line height at 1.5 or more so they don't crowd each other.
- One more exception: a text area's resize handle, which the browser draws at about 12px. Nothing depends on it, because long text scrolls and keyboard users can't use the handle in any browser, and WCAG's target-size rule exempts controls the browser draws. Keep it visible in every theme, and keep the text area itself at least `control-md` tall.

## Choice controls and fields

- For a checkbox, radio, or switch, the whole label is the click target, and each row is `choice-row` tall. The checked state shows a mark (a tick, a dash, or a radio's dot) or a position (a switch's thumb) as well as a fill, and the box edge always meets 3:1 on its own, because the action fill does not.
- Read-only controls look slightly lighter (the control at 75% opacity, the label unchanged), so people can tell they can't be changed before they try. Disabled controls are lighter still, at 50%. A segmented control's labels sit inside its options, so read-only dims only the options that aren't chosen: dimmed, the chosen option's label would fall below 4.5:1 on its fill.
- A radio group is one Tab stop, and the arrow keys move between its radios and select them. A segmented control works the same way, because it is a radio group drawn as connected buttons on a gray track; its chosen option is a rounded white (the card color in dark mode) highlight with a black (near-white in dark mode) border, set just inside the option. The border shows the choice, so the label and icons don't change and the control never changes size. A group of checkboxes is one Tab stop per box.
- A group of checkboxes or radios has a label that names the question, and its help text and error belong to the whole group. The error is linked to every option, so it's announced on each. When the group is disabled or read-only, only the options dim: the group's label and help text stay at full strength, because the help text often says why the choices can't be changed.
- A group of checkboxes has no required state in ARIA. To ask for at least one choice, say "(required)" in the group's label, and show an error in words if nothing is ticked.
- A text field's help text sits between its label and the field, so it's read before typing. A text field is never shorter than `control-md` (40px with a mouse, 44px on touch).

## Forced colors (Windows Contrast themes)

The operating system replaces all colors with a small fixed palette and removes shadows and background images. Build every component so it still works:

- Buttons, inputs, chips, cards, and toggles always have a border. Use `border-color: transparent` when the design doesn't want one visible; it becomes a real border in forced colors. Connected options, such as a segmented control's, share one border instead: the track's edge and the lines between options outline every option, so each option has none of its own. A segmented control's border is transparent (its gray track shows where it is), so it appears only in forced colors and when the control is invalid.
- Selected, checked, and current states never rely on background color alone. Add a border, an underline, a check icon, or a weight change.
- Icons and SVGs use `currentColor`, never a fixed fill.
- Test in forced colors with `@media (forced-colors: active)` and adjust with system colors (`Highlight`, `ButtonText`, `CanvasText`) when something disappears. Text on a `Highlight` fill also needs `forced-color-adjust: none`: otherwise the browser draws a page-colored backplate behind the text, and `HighlightText` vanishes on it.

## More contrast

Under `@media (prefers-contrast: more)`: `ink-muted` becomes `ink`, `border` becomes `border-strong`, and `focus-width` becomes 3px. Five lines in the token file; no component changes.

## Keyboard, pointer, and screen readers

- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for every input. A link that looks like a button is still an `<a>`.
- Build interactive components (dialog, menu, tabs, select, tooltip, popover) on Base UI through shadcn. Never hand-roll their keyboard or ARIA behavior. Base UI follows the WAI-ARIA Authoring Practices, which define the keys people expect:

| Pattern | Keys |
| --- | --- |
| Button | Enter and Space activate. Toggle buttons use `aria-pressed` and keep the same label. |
| Dialog | Tab and Shift+Tab cycle inside; Escape closes; focus returns to the trigger. Focus starts on the first field, or on the least destructive button for confirmations, or on a scrolling body with nothing inside it to Tab to. |
| Menu | Enter, Space, or Down opens on the first item; Up and Down move; Home and End jump; typing a letter jumps to a match; Escape closes. |
| Tabs | Tab moves into the tab list and then to the panel; Left and Right move between tabs. |
| Combobox | Down opens the list; Up and Down move; Enter picks; Escape closes. |

- Hover is never the only way to reach anything. Tooltips also open on focus and never hold essential content.
- Anything done by dragging also works with a single tap or click (WCAG 2.5.7).
- Icon-only buttons have an `aria-label`. Decorative images and icons get `alt=""` or `aria-hidden="true"`.
- Toasts and status updates use a polite live region and never disappear in under 5 seconds or while hovered or focused.
- One `<h1>` per page and no skipped heading levels. Pages have `<header>`, `<nav>`, `<main>`, and `<footer>` landmarks and a "Skip to content" link.
- Help (contact links, a help page) sits in the same place on every page (WCAG 3.2.6).

## Forms and sign-in

The full rules are on the **Forms** page. The accessibility essentials:

- Every input has a visible label. Placeholders are never labels.
- Errors are text next to the field, linked with `aria-describedby`, and marked with `aria-invalid="true"`.
- Don't make people re-enter information they already gave in the same flow (WCAG 3.3.7).
- Sign-in never depends on memory or puzzles alone: allow pasting and password managers, set `autocomplete` on credential fields, and offer an alternative to CAPTCHAs (WCAG 3.3.8).

## Zoom, reflow, and text spacing

- Sizes are in rem (see the Building page), so text and components scale with the reader's browser font setting.
- Text can be enlarged to 200% without losing anything (WCAG 1.4.4).
- Layouts work at 320px wide (400% zoom) with no horizontal scrolling, except for tables and code blocks, which scroll inside their own container (WCAG 1.4.10).
- Nothing breaks when readers override text spacing to line height 1.5, paragraph spacing 2×, letter spacing 0.12em, and word spacing 0.16em (WCAG 1.4.12). Don't give text containers fixed heights.

## Motion

Respect `prefers-reduced-motion`, and pause anything that moves on its own for more than 5 seconds (WCAG 2.2.2). See the Motion page.

## Testing a component

1. Storybook's accessibility checks pass in all three themes.
2. Use it with only a keyboard: reach it, operate it, and see the focus at every step.
3. Use it with a screen reader (VoiceOver on Mac and iPhone, or NVDA on Windows): its name, role, and state are announced.
4. Zoom to 200% and narrow the window to 320px.
5. Check forced colors and reduced motion.
6. Try it on a phone or with `data-pointer="coarse"`.
