# Mouse, touch, and screen size

A fingertip covers about 8–10mm and can't hover. A mouse pointer is a single pixel that can. Most large design systems size controls differently for the two, and Sherbet does too.

## How sizes change

| Token | Mouse and trackpad | Touch screen present | Where the numbers come from |
| --- | --- | --- | --- |
| `target-min` | 24px | 44px | WCAG 2.2 AA requires 24px; Apple, Fluent, Polaris, and WCAG AAA use 44px for touch |
| `control-sm` | 32px | 32px visible, 44px hit area | Small controls stay compact; the hit area grows invisibly |
| `control-md` | 40px | 44px | Desktop systems use 32–40px (Primer, Carbon, Atlassian); touch systems 44–48px |
| `control-lg` | 48px | 52px | Prominent actions |
| `target-gap` | 8px | 8px | Material and Apple both ask for 8px between targets |

**How it switches:** `tokens.css` uses `@media (any-pointer: coarse)`. "Any" matters: GitHub's Primer warns against relying on the *primary* pointer, because a touchscreen laptop reports a mouse but is often used by touch. With `any-pointer`, any device that has a touch screen gets the touch sizes, and only mouse-and-keyboard setups get the compact ones.

To force one mode on part of a page (a preview, a kiosk, or a test), set `data-pointer="coarse"` or `data-pointer="fine"` on an element.

## What each platform does

| Platform | Minimum target | Default control | Body text |
| --- | --- | --- | --- |
| Apple iOS and iPadOS | 44pt (min 28pt) | 44pt | 17pt |
| Apple macOS | 28pt (min 20pt) | 28pt | 13pt |
| Apple visionOS | 60pt | 44pt | 17pt |
| Material 3, touch | 48dp | 40–56dp | 16sp |
| Material 3, pointer | 44dp | 40dp | 14–16sp |
| Fluent 2 (web, iOS, Android) | 44px, 44pt, 48dp | not published | 14px web, 17pt iOS, 16sp Android |
| Primer (GitHub web) | 24px; 44px recommended on mobile | 32px | 14–16px |
| Carbon (IBM web) | not published | 40–48px | 14–16px |
| WCAG 2.2 | 24px (AA), 44px (AAA) | — | — |

The pattern: **touch-first platforms land on 44–48, pointer-first products on 24–40.** Body text barely changes between them; controls and spacing do.

## Designing for touch

- **No hover-only anything.** Touch has no hover. Tooltips also open on focus and long-press, and never hold information someone needs to finish a task (Primer and Atlassian both warn that tooltips are unreliable on mobile).
- **Make whole rows tappable.** A checkbox's `<label>` is part of its target, so a 20px box in a 44px row is fine. The same goes for list items and cards that link somewhere.
- **Keep actions within reach.** On phones, put primary actions for long forms at the bottom of the screen, full width. On wide screens they sit next to the content they act on.
- **No drag-only interactions.** Anything done by dragging also works with a tap or a button (WCAG 2.5.7).
- **Leave the zoom alone.** Never set `user-scalable=no` or `maximum-scale` in the viewport meta tag.
- **Use the right keyboard.** Set `type`, `inputmode`, and `autocomplete` on inputs so phones show the right keyboard and can autofill.

## Designing for mouse and keyboard

- **Every action works from the keyboard,** in a logical order, with a visible focus outline.
- **Hover can add, never replace.** Hover may reveal a shortcut or preview, but the same thing must be reachable by focus or click.
- **Denser is fine.** Desktop users expect more on screen. Use `data-density="compact"` for tables and toolbars, never for forms.
- **Keyboard shortcuts are a bonus,** never the only way to do something. Don't override browser or screen reader shortcuts.

## Screen sizes

- Design for 320px wide first (WCAG reflow), then add layout at the breakpoints. See **Spacing, layout, and shape**.
- Base layouts on available width, not on device names. A tablet in split view is a phone-sized window.
- Body text stays the same size everywhere; headings and page spacing scale.
