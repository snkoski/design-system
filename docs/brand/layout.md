# Spacing, layout, and shape

## Spacing and layout

- A 4px grid written in rem: `space-N` is N × 0.25rem, identical to Tailwind's spacing scale, so `gap-6` in markup equals `space-6` in CSS.
- Space between things comes from `gap` on flex or grid parents, not margins on children.
- Page content is capped at `content-max`, running text at `measure`. Side gutters are at least `space-4`.
- Every interactive element is at least `target-min` (44px) in both directions, counting padding.

## Shape and elevation

- Soft and round. Buttons, chips, badges, and avatars use `radius-full` (pills). Inputs and menus use `radius-md`, cards and dialogs `radius-lg`, and hero panels `radius-xl`.
- Elevation: `shadow-sm` for raised controls, `shadow-md` for popovers and hovered cards, and `shadow-lg` for dialogs. Shadows are espresso-tinted, never gray.
- A shadow never carries meaning alone. Pair it with a border so the element survives forced-colors mode.
