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
