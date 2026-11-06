# Color

Two tiers. **Primitives** (`tangerine-500`, `gray-900`, `mint-200`…) are the raw palette and never appear in components. **Semantic tokens** (`bg`, `ink`, `action`…) say what a color is for. They point at primitives and change per theme.

## Neutral components, brand in the layout

Components are drawn in black, white, and grays. The brand colors belong to the page around them: hero bands, feature panels, illustrations, highlights, and small flourishes. That includes the app shell and page header: they're neutral components, and an app that wants its brand there sets a `brand` or `surface-tint` background on their wrapper with its own CSS.

- **Why:** a component that carries no brand color fits any brand, so the same components can serve another site or a work system with its own palette. It also leaves the brand colors free for the layout. A tangerine primary button on a tangerine hero band would disappear into it; a black one stands out on any band.
- Every token a component reads is neutral: `surface`, `surface-hover`, `track`, `track-hover`, `ink`, `ink-muted`, `border`, `border-strong`, `action`, `action-hover`, `on-action`, and `focus`. The scale behind them is pure gray (`gray-50` to `gray-950`, no hue), so they don't pick up a tint from the palette.
- The brand tokens are `brand` (with `on-brand` for text on it), `surface-tint`, `highlight`, `link`, and the page ground `bg`. Components never use any of them except `bg` behind them: no `brand`, `surface-tint`, `link`, or `highlight`.
- Status colors (`success`, `warning`, `danger`) aren't brand colors. Components use them for what they mean, always with an icon or a word.

## Tokens

- Page ground is `bg`. Cards, menus, dialogs, and inputs sit on `surface`.
- All body text is `ink`; secondary text is `ink-muted`. Both pass AA on `bg`, `surface`, `surface-tint`, and `surface-hover` in every theme.
- Controls: `action` fills a primary button, a ticked checkbox, a selected radio, and an on switch, with `on-action` for the label or mark on it and `action-hover` on hover and press. Near black in light and hot dog, near white in dark.
- Hover: `surface-hover`, a light gray (dark gray in dark mode), for secondary and ghost buttons and unchecked choice controls.
- Tracks: a segmented control's options sit on `track`, a gray with no visible edge, and hover in `track-hover`. The chosen option is a rounded `surface` highlight with an `ink` border, set `segment-inset` inside the option so a little of the track shows around it; hovering an option draws the same rounded shape in `track-hover`.
- Brand: `brand` for bands and panels in a layout, with `on-brand` text. Never white text on `brand`. Highlighted panels and callouts use `surface-tint`.
- Links: `link`, always underlined, in running text on the page. A link inside a component (such as "terms and conditions" in a checkbox label) is `ink` and underlined instead: the underline marks it, and the component stays neutral. Form controls do this for any link in their label, description, or error.
- Highlights in a layout, such as a marker behind a word in a hero: `highlight` with `on-highlight`. Components don't use it: a tag or chip is gray, and a badge's colors are set with the status colors (see `docs/brand/badges.md`).
- Decorative lines use `border`. Anything someone must see to use (input edges, checkbox outlines) uses `border-strong`.
- Status: `success`, `warning`, and `danger` for text and icons, with `success-soft`, `warning-soft`, and `danger-soft` as message backgrounds (text on those is `ink`). A status Badge uses the soft color as its fill with its words and icon in the status color, so the tones stay apart in hot dog mode, where every soft color is white. A status color is always paired with an icon or a word. Success is teal, not green, so it never depends on red-green hue alone.
- Badges: gray (`neutral`, a `track` fill with `ink` words) unless a status color means something, such as `success` for an offer or `danger` for a rejection. Badges that are only different steps or kinds are told apart by their words, not by color. There's no categorical palette for charts yet; one gets added when a chart needs more than one color.

## Themes

| Theme | Feel | Ground / ink / brand |
| --- | --- | --- |
| `light` (default) | Cream page, sunny | `cream-50` / `gray-900` / `tangerine-500` |
| `dark` | Espresso night, mint links | `espresso-900` / `gray-50` / `tangerine-400` |
| `hotdog` | Ketchup and mustard, chunky | `mustard-400` / `char-950` / `ketchup-600` |

- Light or dark follows the visitor's system setting until they choose. Hot dog mode is only ever an explicit choice.
- Hot dog mode is a joke that is built properly: it passes the same contrast checks, and it swaps soft shadows for hard offset shadows and `border-thick` outlines. The one exception is Skeleton's placeholder shapes, which get a thin ink edge, so they don't look like real controls. Its controls are black and white like everyone else's; the ketchup and mustard are in the page.

## Dark mode

- Dark mode is its own design, not an inverted light mode. Colors are re-chosen so every pair still meets contrast.
- **Higher surfaces are lighter.** `surface` and `surface-tint` sit above `bg` by being lighter, because shadows barely show on dark backgrounds (the same approach as Apple, Atlassian, and Material).
- Controls flip: `action` is near white with near-black marks and labels on it.
- Brand colors get lighter in dark mode (`tangerine-400` instead of `tangerine-500`, mint links instead of tangerine), with dark text on them through the `on-…` tokens.
- Avoid pure black backgrounds; `espresso-900` keeps some warmth and reduces glare.

## Contrast at a glance

| What | Minimum | Sherbet's check |
| --- | --- | --- |
| Body and UI text | 4.5:1 | `ink` and `ink-muted` on `bg`, `surface`, `surface-tint`, and `surface-hover` |
| Large text (24px+, or 19px+ bold) | 3:1 | Headings use `ink`, so they exceed this |
| Control borders, focus outlines, and meaningful icons | 3:1 | `border-strong` and `focus` |
| High-contrast theme (future) | 7:1 | Not built yet |

Every system studied (Apple, Material, Primer, Atlassian, Carbon, Fluent, Polaris, GOV.UK, and USWDS) uses these same WCAG AA numbers.
