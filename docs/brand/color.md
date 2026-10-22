# Color

Two tiers. **Primitives** (`tangerine-500`, `espresso-950`, `mint-200`…) are the raw palette and never appear in components. **Semantic tokens** (`bg`, `ink`, `action`…) say what a color is for. They point at primitives and change per theme.

- Page ground is `bg`. Cards, menus, dialogs, and inputs sit on `surface`. Highlighted panels use `surface-tint`.
- All body text is `ink`; secondary text is `ink-muted`. Both pass AA on `bg`, `surface`, and `surface-tint` in every theme.
- Primary buttons: `action` fill with `on-action` text, `action-hover` on hover and press. Never put white text on `action`.
- Links: `link`, always underlined in running text.
- Chips, badges, and selection: `highlight` with `on-highlight`.
- Decorative lines use `border`. Anything someone must see to use (input edges, checkbox outlines) uses `border-strong`.
- Status: `success`, `warning`, and `danger` for text and icons, with `success-soft`, `warning-soft`, and `danger-soft` as message backgrounds (text on those is `ink`). A status color is always paired with an icon or a word. Success is teal, not green, so it never depends on red-green hue alone.

## Themes

| Theme | Feel | Ground / ink / action |
| --- | --- | --- |
| `light` (default) | Cream and espresso, sunny | `cream-50` / `espresso-950` / `tangerine-500` |
| `dark` | Espresso night, mint links | `espresso-900` / `latte-100` / `tangerine-400` |
| `hotdog` | Ketchup and mustard, chunky | `mustard-400` / `char-950` / `ketchup-600` |

- Light or dark follows the visitor's system setting until they choose. Hot dog mode is only ever an explicit choice.
- Hot dog mode is a joke that is built properly: it passes the same contrast checks, and it swaps soft shadows for hard offset shadows and `border-thick` outlines.

## Dark mode

- Dark mode is its own design, not an inverted light mode. Colors are re-chosen so every pair still meets contrast.
- **Higher surfaces are lighter.** `surface` and `surface-tint` sit above `bg` by being lighter, because shadows barely show on dark backgrounds (the same approach as Apple, Atlassian, and Material).
- Accent colors get lighter in dark mode (`tangerine-400` instead of `tangerine-500`, mint links instead of tangerine), with dark text on them through the `on-…` tokens.
- Avoid pure black backgrounds; `espresso-900` keeps some warmth and reduces glare.

## Contrast at a glance

| What | Minimum | Sherbet's check |
| --- | --- | --- |
| Body and UI text | 4.5:1 | `ink` and `ink-muted` on `bg`, `surface`, and `surface-tint` |
| Large text (24px+, or 19px+ bold) | 3:1 | Headings use `ink`, so they exceed this |
| Control borders, focus outlines, and meaningful icons | 3:1 | `border-strong` and `focus` |
| High-contrast theme (future) | 7:1 | Not built yet |

Every system studied (Apple, Material, Primer, Atlassian, Carbon, Fluent, Polaris, GOV.UK, and USWDS) uses these same WCAG AA numbers.

