# Spacing, layout, and shape

## Spacing and layout

- A 4px grid written in rem: `space-N` is N × 0.25rem, identical to Tailwind's spacing scale, so `gap-6` in markup equals `space-6` in CSS. (Fluent, Polaris, and Primer use a 4px base; Material, Carbon, and Atlassian use 8px with 2px and 4px half-steps. Both land on the same values.)
- Space between things comes from `gap` on flex or grid parents, not margins on children.
- Page content is capped at `content-max`, running text at `measure`. Side gutters are at least `space-4` (16px).
- **Component spacing stays the same at every width. Page spacing grows.** Gaps between sections, page padding, and gutters step up from phone to desktop (GOV.UK's responsive spacing and USWDS margins do the same). A good default: section gaps `space-12` on phones, `space-16` from `breakpoint-md`, and page side padding `space-4`, `space-6`, then `space-8`.

## Breakpoints

Min-width breakpoints in em, mobile-first. Start with one column and add layout as space allows.

| Token | Width | Typical devices | What changes |
| --- | --- | --- | --- |
| (none) | under 640px | Phones | One column, full-width controls in forms, bottom-anchored actions on long forms |
| `breakpoint-sm` | 640px | Large phones in landscape, small tablets | Headings near their larger sizes; side-by-side buttons fit |
| `breakpoint-md` | 768px | Tablets in portrait | Two columns become possible; page spacing steps up |
| `breakpoint-lg` | 1024px | Tablets in landscape, small laptops | Persistent side navigation; three columns for cards |
| `breakpoint-xl` | 1280px | Laptops and desktops | Content approaches `content-max` |
| `breakpoint-2xl` | 1536px | Large monitors | Add whitespace, not more columns of text |

These sit where the big systems cluster: around 480–640px for large phones, about 768px for tablets, about 1024px for laptops, and 1280–1440px for desktops. Use them in Tailwind as `sm:`, `md:`, `lg:`, `xl:`, and `2xl:`. Design for 320px wide as the smallest screen (WCAG 1.4.10 reflow).

## Targets and controls

See **Mouse, touch, and screen size** for the full reasoning. In short:

- Every interactive element's hit area is at least `target-min`: **24px with a mouse or trackpad, 44px whenever a touch screen is present.** The visible control can be smaller; padding or an invisible pseudo-element makes up the difference.
- Separate small targets are at least `target-gap` (8px) apart.
- Control heights: `control-sm` 32px, `control-md` 40px (44px on touch), and `control-lg` 48px (52px on touch). Text inputs use the same heights as buttons so they line up in a row.
- Checkboxes and other small choice controls use `radius-sm` and the `choice` size (24px). Each row is `choice-row` tall (32px with a mouse, 44px on touch), and the whole label is the target, so rows stack with no gap.

## Density

- **Comfortable is the default.** Material, Primer, and Atlassian all keep dense layouts opt-in.
- `data-density="compact"` on a container shrinks `control-md` to 32px and `control-lg` to 40px. Use it for data tables, toolbars, and admin screens on desktop. Hit areas still meet `target-min`.
- Don't use compact density on touch-first screens, in menus or dialogs, or for forms that people fill in once. Don't mix densities within one view.
- Density changes spacing and control height, never text size.

## Shape and elevation

- Soft and round. Buttons, chips, badges, and avatars use `radius-full` (pills). Inputs and menus use `radius-md`, cards and dialogs `radius-lg`, and hero panels `radius-xl`.
- Elevation: `shadow-sm` for raised controls, `shadow-md` for popovers and hovered cards, and `shadow-lg` for dialogs. Shadows are espresso-tinted, never gray.
- A shadow never carries meaning alone. Pair it with a border so the element survives forced-colors mode.
- **In dark mode, higher surfaces are lighter**, not just shadowed (Apple's elevated backgrounds, Atlassian's elevation, and Material's tonal surfaces). That's why `surface` is lighter than `bg` in the dark theme.
