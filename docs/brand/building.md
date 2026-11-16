# Building with the design system

## Stack

- **Static and content sites:** Astro. React components render to HTML at build time and ship no JavaScript unless marked as an island (`client:visible`, `client:load`).
- **Controls that submit through a hidden input** (NumberField and DatePicker) show formatted text and submit the plain value from a hidden input that their JavaScript keeps in step. Without JavaScript (an Astro page with no island, or before hydration), what's typed doesn't reach the form, which sends the starting value. Make them part of an island.
- **Apps:** React with Vite, or a server-rendered framework, using the same components.
- **Components:** shadcn/ui on **Base UI** (the shadcn default for new projects). Base UI provides keyboard, focus, and screen-reader behavior; Sherbet provides the look. Components are copied into the repo and are ours to edit.
- **Icons:** Lucide.

## CSS architecture

Two kinds of CSS, with a fixed boundary between them.

| Tailwind utilities, in the markup | Component CSS, in a class |
| --- | --- |
| How a component sits in its context: margin, `gap`, flex and grid, width, position, and responsive layout | What a component is: color, type, border, radius, shadow, inner padding, variants, and states such as hover, focus, disabled, and selected |

- Inner padding belongs to the component, so a button is the same size everywhere it is used.
- Tailwind is used only for spacing, sizing, and layout. Its color, font, and shadow utilities are not used; those come from component classes and tokens.
- Layer order: `@layer theme, base, components, utilities;` Component CSS goes in `components`, so a utility in the markup can still override it for a one-off exception.
- Form controls share what they have in common: one stylesheet for labels and descriptions, one for text fields, one for checkboxes, radios, and switches, and one for groups. Each part carries the shared class next to its own (`class="choice__control checkbox__box"`), and a component's own CSS holds only what's different about it, so a fix to the shared look reaches every control at once.

```html
<section class="grid gap-6 md:grid-cols-3 mt-12">
  <article class="card">…</article>
  <article class="card" data-variant="featured">…</article>
</section>
```

## Classes, variants, and state

Each job has exactly one convention. Never use two conventions for the same job.

| Job | Convention | Example |
| --- | --- | --- |
| Name a component and its parts | Class | `.card`, `.card__title`, `.button__icon` |
| Variant or size: a design choice from a fixed set, set by the author | `data-*` attribute | `data-variant="secondary"`, `data-size="sm"`, `data-tone="danger"` |
| State with an accessibility meaning | ARIA attribute | `aria-current="page"`, `aria-pressed="true"`, `aria-invalid="true"`, `aria-expanded="true"` |
| State without an ARIA meaning | Base UI's `data-*` state attribute | `data-open`, `data-disabled`, `data-checked`, `data-highlighted` |

- **No modifier classes.** `.button--secondary` is not used; variants are always `data-*` attributes.
- A `data-*` attribute holds one value, so an element can't be two variants at once. React props map straight across: `<Button variant="secondary">` renders `data-variant="secondary"`. This replaces shadcn's `cva` class strings.
- Style state from the ARIA attribute whenever one exists, so the look and what a screen reader announces can never disagree. Only fall back to a `data-*` state attribute when ARIA has no equivalent.
- Every variant has a default. With no `data-variant`, a component renders its default variant.
- Attribute selectors have the same specificity as a class, so `.button[data-variant="secondary"]` overrides `.button` cleanly with no `!important`.

```css
@layer components {
  .button { background: var(--action); color: var(--on-action); border: var(--border-thick) solid transparent; }
  .button[data-variant="secondary"] { background: transparent; color: var(--ink); border-color: var(--border-strong); }
  .button[data-size="sm"] { min-height: var(--control-sm); }
  .button[aria-pressed="true"] { background: var(--highlight); color: var(--on-highlight); border-color: var(--ink); }

  .nav-link[aria-current="page"] { text-decoration: underline; font-weight: 600; }
  .input[aria-invalid="true"] { border-color: var(--danger); }
  .menu-item[data-highlighted] { background: var(--surface-hover); }
}
```

```css
@layer components {
  .card {
    background: var(--surface);
    color: var(--ink);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }
}
```

## Tokens

- **Primitives** are the raw palette (`tangerine-500`). **Semantic tokens** say what a value is for (`action`). Components read semantic tokens only, never primitives.
- Tokens are CSS custom properties. Tailwind v4's `@theme` reads the same spacing and size values, so utilities and component CSS share one source.
- **HSL only.** Colors are written `hsl(H S% L%)`. No hex, no named colors.
- **Re-branding** a site: load a brand file after the Sherbet tokens that redefines the brand tokens (`bg`, `brand`, `on-brand`, `surface-tint`, `highlight`, `on-highlight`, and `link`, plus its own primitives) under `:root` and each `[data-theme]`. Components are neutral, so they don't change and need no new colors. Recheck contrast for every brand in every theme.
- **A calmer type scale** for a client site: override the five heading sizes with fixed values (a 1.25 ratio from 1.125rem body) in the brand file. Everything else stays.

## Units: rem or px

- **rem** for font sizes, spacing, radii, component sizes, icon sizes, and max widths, so everything scales with the reader's browser font setting.
- **px** only for details that should stay crisp and not grow: `border-thin` (1px), `border-thick` (2px), `focus-width`, `focus-offset`, and shadow offsets.
- **em** for media queries (`@media (min-width: 48em)`), so breakpoints follow the reader's font size too.
- **lh** and **em** elsewhere only where a part must match the text around it: TextArea's padding and Badge's corners use `1lh` (one line height), and Skeleton's text lines are `1lh` tall with a `1em` bar.
- Never set a px font size, and never set `html { font-size }` to a px value.

## Themes

- Themes are set by `data-theme` on `<html>`: `light`, `dark`, or `hotdog`. With no attribute, light or dark follows `prefers-color-scheme`.
- Each theme sets `color-scheme` (hot dog mode uses `light`) so native controls and scrollbars match.
- The visitor's choice is remembered in localStorage and applied by a tiny inline script in `<head>` before first paint, so there is no flash of the wrong theme.
- The theme switcher offers System, Light, Dark, and Hot dog.
