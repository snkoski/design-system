/**
 * The math for a field of bars that stand on end toward the pointer, kept apart from the canvas so it can be
 * tested. Angles are in degrees, clockwise from pointing up, and never wrap, so each turn takes the short way.
 */
import { closeness } from "@/experiments/Proximity/tracker";
import type { ProximityFade } from "@/experiments/Proximity/Proximity";

/** Where the bars sit, in CSS px from the canvas's top left: a grid of cells, each bar in the middle of its cell */
export interface Layout {
  columns: number;
  rows: number;
  /** The distance between neighboring bars' centers */
  pitch: number;
}

/**
 * The angle that stands a bar on end from `(dx, dy)` away, or `null` when the pointer is on its center. A bar looks
 * the same turned half way round, so this is the same toward and away from the pointer.
 */
export function barAngle(dx: number, dy: number) {
  if (dx === 0 && dy === 0) return null;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/** `target`, moved by half turns to be as close as possible to `previous`: a bar never turns more than 90 degrees */
export function nearestHalfTurn(previous: number, target: number) {
  const delta = ((((target - previous) % 180) + 270) % 180) - 90;
  return previous + delta;
}

/**
 * How much of the way to its target a bar turns in `elapsed` ms. Exponential, so it eases out and doesn't depend
 * on the frame rate: after `turnDuration` ms it's 95% of the way there. 0 snaps straight to it.
 */
export function catchUp(elapsed: number, turnDuration: number) {
  if (turnDuration <= 0) return 1;
  return 1 - Math.exp((-3 * elapsed) / turnDuration);
}

/** Below this, in degrees, a bar counts as having arrived, and drawing can stop until something changes */
const SETTLED = 0.05;

/**
 * Turns every bar in `angles` part of the way toward `pointer` (in the same px as `layout`), and returns whether
 * they've all arrived. With no pointer yet, nothing turns.
 */
export function step(angles: Float32Array, layout: Layout, pointer: { x: number; y: number } | null, amount: number) {
  if (!pointer) return true;
  let settled = true;
  for (let row = 0; row < layout.rows; row++) {
    for (let column = 0; column < layout.columns; column++) {
      const index = row * layout.columns + column;
      const target = barAngle(pointer.x - (column + 0.5) * layout.pitch, pointer.y - (row + 0.5) * layout.pitch);
      if (target === null) continue;
      const previous = angles[index]!;
      const delta = nearestHalfTurn(previous, target) - previous;
      if (Math.abs(delta) < SETTLED) {
        angles[index] = previous + delta;
        continue;
      }
      angles[index] = previous + delta * amount;
      settled = false;
    }
  }
  return settled;
}

/** Below this, a bar's closeness counts as having arrived */
const SETTLED_CLOSENESS = 0.002;

/**
 * Moves every bar's closeness in `levels` part of the way toward how close `pointer` is to its cell, from 0
 * (`reach` px or more away) to 1 (over it), measured as Proximity measures an element. With no pointer, everything
 * heads back to 0. Returns whether they've all arrived.
 */
export function approach(levels: Float32Array, layout: Layout, pointer: { x: number; y: number } | null, reach: number, amount: number) {
  let settled = true;
  for (let row = 0; row < layout.rows; row++) {
    for (let column = 0; column < layout.columns; column++) {
      const index = row * layout.columns + column;
      const cell = { left: column * layout.pitch, top: row * layout.pitch, right: (column + 1) * layout.pitch, bottom: (row + 1) * layout.pitch };
      const target = pointer ? closeness(cell, pointer, reach) : 0;
      const previous = levels[index]!;
      const delta = target - previous;
      if (Math.abs(delta) < SETTLED_CLOSENESS) {
        levels[index] = target;
        continue;
      }
      levels[index] = previous + delta * amount;
      settled = false;
    }
  }
  return settled;
}

/** How opaque a bar is at `level` of closeness, fading as Proximity does: `out` as the pointer comes near, or `in` */
export function fadeAlpha(level: number, fade: ProximityFade | undefined, faintest: number) {
  const floor = Math.min(Math.max(faintest, 0), 1);
  if (fade === "out") return 1 - level * (1 - floor);
  if (fade === "in") return floor + level * (1 - floor);
  return 1;
}
