/**
 * One shared pointer listener aims every LookAt on the page, so a grid of hundreds adds one listener, not
 * hundreds. On each move it measures every LookAt first, then turns them all, so the browser doesn't have
 * to recalculate layout between them.
 */
export interface Watcher {
  /** The element to measure from (its center) and to set --look-angle on */
  element: HTMLElement;
  /** Face away from the pointer instead of toward it */
  away: boolean;
  /** The last angle set, in degrees, without wrapping, so each turn takes the shortest way round */
  angle: number;
}

const watchers = new Set<Watcher>();
let pointer: { x: number; y: number } | null = null;

/** The rotation that turns content drawn pointing up to face from `rect`'s center toward (or away from) the pointer */
export function targetAngle(rect: DOMRect, away: boolean, at: { x: number; y: number }) {
  const dx = at.x - (rect.left + rect.width / 2);
  const dy = at.y - (rect.top + rect.height / 2);
  if (dx === 0 && dy === 0) return null; // the pointer is on its center: keep facing the same way
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90 + (away ? 180 : 0);
}

/** `target`, moved by whole turns to be as close as possible to `previous` */
export function nearest(previous: number, target: number) {
  const delta = ((((target - previous) % 360) + 540) % 360) - 180;
  return previous + delta;
}

function aim(only?: Watcher) {
  if (!pointer) return;
  const list = only ? [only] : [...watchers];
  const rects = list.map((watcher) => watcher.element.getBoundingClientRect()); // read everything first
  list.forEach((watcher, index) => {
    const target = targetAngle(rects[index]!, watcher.away, pointer!);
    if (target === null) return;
    watcher.angle = nearest(watcher.angle, target);
    watcher.element.style.setProperty("--look-angle", `${watcher.angle}deg`); // then write
  });
}

function onPointerMove(event: PointerEvent | MouseEvent) {
  pointer = { x: event.clientX, y: event.clientY };
  aim();
}

/** Things move under a still pointer when the page scrolls or resizes */
function onLayoutChange() {
  aim();
}

/** Starts aiming `watcher`, and returns the function that stops it */
export function watch(watcher: Watcher) {
  watchers.add(watcher);
  if (watchers.size === 1) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onLayoutChange, { passive: true, capture: true });
    window.addEventListener("resize", onLayoutChange, { passive: true });
  }
  aim(watcher); // face the last known pointer straight away
  return () => {
    watchers.delete(watcher);
    if (watchers.size === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onLayoutChange, { capture: true });
      window.removeEventListener("resize", onLayoutChange);
    }
  };
}

/** Re-aims one watcher, after its direction changes */
export function reaim(watcher: Watcher) {
  aim(watcher);
}

/** Forgets the pointer's position, so each test starts as a fresh page does. For tests only. */
export function forgetPointer() {
  pointer = null;
}
