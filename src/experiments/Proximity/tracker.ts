/**
 * One shared pointer listener updates every Proximity on the page, so a grid of hundreds adds one listener, not
 * hundreds. On each move it measures every one first, then writes them all, so the browser doesn't have to
 * recalculate layout between them.
 */
export interface Watcher {
  /** The element to measure, and to set --proximity (and --proximity-color) on */
  element: HTMLElement;
  /** How far away the pointer starts to count, in px from the element's nearest edge */
  reach: number;
  /** The colors to go through, from far to near. Fewer than two: no color. */
  colors: string[];
  colorSpace: ColorSpace;
}

export type ColorSpace = "srgb" | "oklch" | "hsl";

/**
 * How close `at` is to `rect`, from 0 (`reach` px or more from its nearest edge) to 1 (on its edge, or over it),
 * in a straight line between
 */
export function closeness(rect: { left: number; top: number; right: number; bottom: number }, at: { x: number; y: number }, reach: number) {
  const dx = Math.max(rect.left - at.x, 0, at.x - rect.right);
  const dy = Math.max(rect.top - at.y, 0, at.y - rect.bottom);
  const distance = Math.hypot(dx, dy);
  if (reach <= 0) return distance === 0 ? 1 : 0;
  return Math.min(Math.max(1 - distance / reach, 0), 1);
}

/**
 * The color `amount` of the way through `colors`, from the first (0) to the last (1), passing through each one
 * in between at even steps, as a CSS color-mix() in `space`. `null` with fewer than two colors.
 */
export function colorAt(colors: string[], amount: number, space: ColorSpace) {
  if (colors.length < 2) return null;
  const along = Math.min(Math.max(amount, 0), 1) * (colors.length - 1);
  const from = Math.min(Math.floor(along), colors.length - 2);
  const toward = Math.round((along - from) * 1000) / 10; // a percentage, to one decimal place
  return `color-mix(in ${space}, ${colors[from]}, ${colors[from + 1]} ${toward}%)`;
}

const watchers = new Set<Watcher>();
let pointer: { x: number; y: number } | null = null;

function update(only?: Watcher) {
  const list = only ? [only] : [...watchers];
  // Read everything first
  const amounts = list.map(({ element, reach }) => {
    if (element.matches(":focus-within")) return 1; // keyboard focus inside counts as the pointer right over it
    return pointer ? closeness(element.getBoundingClientRect(), pointer, reach) : 0;
  });
  // Then write
  list.forEach(({ element, colors, colorSpace }, index) => {
    const amount = amounts[index]!;
    element.style.setProperty("--proximity", String(Math.round(amount * 1000) / 1000));
    const color = colorAt(colors, amount, colorSpace);
    if (color) element.style.setProperty("--proximity-color", color);
    else element.style.removeProperty("--proximity-color");
  });
}

function onPointerMove(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY };
  update();
}

/** The pointer left the window: nothing is near it any more */
function onPointerOut(event: PointerEvent) {
  if (event.relatedTarget) return; // just moving from one element to another
  pointer = null;
  update();
}

/** Things move under a still pointer when the page scrolls or resizes, and focus moves without it */
function onChange() {
  update();
}

/** Starts updating `watcher`, and returns the function that stops it */
export function watch(watcher: Watcher) {
  watchers.add(watcher);
  if (watchers.size === 1) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("scroll", onChange, { passive: true, capture: true });
    window.addEventListener("resize", onChange, { passive: true });
    window.addEventListener("focusin", onChange);
    window.addEventListener("focusout", onChange);
  }
  update(watcher); // match the last known pointer straight away
  return () => {
    watchers.delete(watcher);
    if (watchers.size === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onChange, { capture: true });
      window.removeEventListener("resize", onChange);
      window.removeEventListener("focusin", onChange);
      window.removeEventListener("focusout", onChange);
    }
  };
}

/** Updates one watcher straight away, after its settings change */
export function refresh(watcher: Watcher) {
  update(watcher);
}

/** Forgets the pointer's position, so each test starts as a fresh page does. For tests only. */
export function forgetPointer() {
  pointer = null;
}
