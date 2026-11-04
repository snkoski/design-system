# Motion

Motion explains something: where an element came from, what changed, or what can be pressed. If it explains nothing, leave it out.

## Tokens

`tokens.json` has no motion family, so `scripts/build-tokens.mjs` writes these into `src/styles/tokens.css` alongside the other tokens. Try them in the live demo on this page.

```css
:root {
  --duration-fast: 120ms;   /* hover, press, color, and small state changes */
  --duration-base: 200ms;   /* popovers, menus, tooltips, accordions */
  --duration-slow: 320ms;   /* dialogs, drawers, page-level reveals */
  --duration-loop: 700ms;   /* one cycle of a looping animation: spinners, skeleton shimmer */

  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);    /* things entering */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);         /* things leaving */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* things moving or morphing */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* playful overshoot, sparingly */

  --motion-distance: 0.5rem; /* how far things slide when entering */
  --motion-scale: 0.85;      /* where things pop in from */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-distance: 0rem;
    --motion-scale: 1;
    --duration-base: 120ms;
    --duration-slow: 120ms;
    --duration-loop: 1600ms;
    --ease-bounce: var(--ease-out);
  }
}
```

To override the visitor's system setting for part of a page, for example a site's own motion preference switch, set `data-motion="full"` or `data-motion="reduced"` on an element. Everything inside it follows that setting.

## Rules

- Interface motion runs 100–320ms. Exits are faster than entrances: an element leaves with `--ease-in` at the next shorter duration.
- Looping animations (spinners, skeleton shimmer) use `--duration-loop` for one cycle. Reduced motion slows them down rather than stopping them, so a loading indicator stays visible.
- Things that move, appear, or disappear animate only `transform` and `opacity`. The browser can do both without redrawing the page. Never animate width, height, top, left, margin, or padding.
- The one exception is a state change on a control: hover, press, focus, checked, chosen, or invalid. Its `color`, `background-color`, `border-color`, and `box-shadow` may fade over `--duration-fast` with `--ease-out`, so states don't snap. A short fade on a small control costs very little to redraw. Keep these fades to the properties that changed, never `transition: all`.
- Slides and shifts use `--motion-distance`, and pops use `--motion-scale`, so reduced motion turns them into fades with no component changes.
- Movement that carries meaning is the exception. A switch's thumb moving to the other end is how it shows on and off, so it moves the full distance even with reduced motion, quickly and without bounce (the bounce token turns into a plain ease-out). Don't build it from `--motion-distance`, which becomes 0.
- `--ease-bounce` is Sherbet's one playful flourish: chips, toggles, and success states only, never dialogs, menus, or anything that blocks the reader.
- Nothing moves by itself for more than 5 seconds without a pause control. No parallax, no autoplaying carousels.

## In components

- Components own their own motion: hover and press feedback, open and close, and expand and collapse.
- Base UI marks entering and leaving elements with `data-starting-style` and `data-ending-style`, so enter and exit animations are plain CSS transitions:

```css
.popover {
  transition: opacity var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);
}
.popover[data-starting-style],
.popover[data-ending-style] {
  opacity: 0;
  transform: translateY(var(--motion-distance)) scale(0.98);
}
```

- Primary buttons lift slightly on hover (`translateY(-1px)`) and settle on press. In hot dog mode they push into their hard shadow instead.

## Page level

- Page transitions use the browser's View Transitions API (built into Astro). Keep them to a crossfade, or a short slide that honors `--motion-distance`.
- Content is fully visible without animation. A reveal may fade in, but nothing waits invisible for a scroll observer.
