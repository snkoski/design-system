# Iconography

- **Lucide** (shadcn's default set): outline icons, 2px stroke, round caps.
- Icons inherit color with `currentColor`. Never hard-code an icon fill.
- Sizes: `icon-sm` (16px) in chips, small buttons, and small text; `icon-md` (20px) beside body text and in buttons; `icon-lg` (24px) in large buttons, navigation bars, and empty states. (Button's and SegmentedControl's `lg` sizes still use `icon-md`; see `docs/revisit.md`.) Material uses the same three steps, with 20px for desktop and dense layouts and 24px as its touch default.
- An icon in a button sits inside the button's hit area; the icon itself never needs to be 44px.
- Meaningful icons meet 3:1 contrast against their background.
- Lines are `icon-stroke` (2). A chosen segment thickens its icons' lines to `icon-stroke-bold` (2.75), the icon version of its bold label, so the choice doesn't rely on color. Filled icons don't change, so pair them with label text.
- An icon-only button always has an accessible name (`aria-label`). Decorative icons get `aria-hidden="true"`.
- No emoji in UI.

## Logo

There is no logo yet. Set the name in Geist at weight 800 in `ink` until one exists.
