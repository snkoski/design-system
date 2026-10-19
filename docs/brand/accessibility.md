# Accessibility

These are requirements. A component that breaks one is not done.

## Contrast

- Text meets 4.5:1 on its ground in every theme (3:1 only for text 24px+ or bold 19px+). Each text token's usage note names the grounds it is checked on; use it only on those.
- Borders that someone must see to use a control, focus outlines, and meaningful icons meet 3:1. Use `border-strong` for control edges, not `border`.
- Color never carries meaning alone. Status, selection, errors, and required fields always add an icon, word, or shape.

## Focus

- Every interactive element shows a visible focus state on keyboard focus (`:focus-visible`).
- Focus is an **outline, never only a box-shadow**: `outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset);`. Shadows disappear in forced-colors mode; outlines do not.
- Never remove an outline without replacing it.
- Focus order follows reading order. Dialogs and menus trap focus while open and return it to the trigger on close (Base UI does this; don't override it).

## Forced colors (Windows Contrast themes)

The operating system replaces all colors with a small fixed palette and removes shadows and background images. Build every component so it still works:

- Buttons, inputs, chips, cards, and toggles always have a border. Use `border-color: transparent` when the design doesn't want one visible; it becomes a real border in forced colors.
- Selected, checked, and current states never rely on background color alone. Add a border, an underline, a check icon, or a weight change.
- Icons and SVGs use `currentColor`, never a fixed fill.
- Test in forced colors with `@media (forced-colors: active)` and adjust with system colors (`Highlight`, `ButtonText`, `CanvasText`) when something disappears.

## More contrast

Under `@media (prefers-contrast: more)`: `ink-muted` becomes `ink`, `border` becomes `border-strong`, and `focus-width` becomes 3px. Five lines in the token file; no component changes.

## Keyboard, pointer, and screen readers

- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for every input. A link that looks like a button is still an `<a>`.
- Build interactive components (dialog, menu, tabs, select, tooltip, popover) on Base UI through shadcn. Never hand-roll their keyboard or ARIA behavior.
- Every interactive target is at least `target-min` (44px) in both directions.
- Hover is never the only way to reach anything. Tooltips also open on focus and never hold essential content.
- Icon-only buttons have an `aria-label`. Decorative images and icons get `alt=""` or `aria-hidden="true"`.
- Form errors appear as text beside the field, are linked with `aria-describedby`, and are announced. The first invalid field receives focus on submit.
- Toasts and status updates use a polite live region and never disappear in under 5 seconds or while hovered or focused.
- One `<h1>` per page and no skipped heading levels. Pages have `<header>`, `<nav>`, `<main>`, and `<footer>` landmarks and a "Skip to content" link.

## Zoom and sizing

- Sizes are in rem (see the Building page), so text and components scale with the reader's browser font setting.
- Layouts work at 400% zoom (320 CSS pixels wide) with no horizontal scrolling, except for tables and code blocks, which scroll inside their own container.

## Motion

Respect `prefers-reduced-motion`. See the Motion page.
