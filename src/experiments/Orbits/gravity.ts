/** Something with mass, where it is (its top left corner, in px), and its size */
export interface Massive {
  x: number;
  y: number;
  width: number;
  height: number;
  /** How hard it pulls on everything else, and how hard it is to knock aside. 0 or less takes no part. */
  mass: number;
}

/** Something with mass that's moving, or `fixed` in place (a star, or held, paused, or under reduced motion) */
export interface Moving extends Massive {
  vx: number;
  vy: number;
  fixed: boolean;
}

export type OrbitDirection = "clockwise" | "counterclockwise";

/**
 * How strong gravity is. A mass of 100 holds something 200px away in a circular orbit at 150px per second
 * (speed² = G × mass ÷ distance), and a mass of 1 pulls something 100px away at 4.5px per second per second.
 */
export const G = 45_000;

/** How much of their speed towards each other two things keep when they collide: 1 keeps it all, 0 none */
const RESTITUTION = 0.5;
/** Colliding slower than this, in px per second, they don't bounce: resting on a star, rather than jittering on it */
export const REST = 100;

/** Roughly the distance between two things' centers when they touch */
function touching(a: Massive, b: Massive) {
  return (a.width + b.width + a.height + b.height) / 4;
}

/** From a's center to b's: the distance, and the direction as a unit vector */
function between(a: Massive, b: Massive) {
  const dx = b.x + b.width / 2 - (a.x + a.width / 2);
  const dy = b.y + b.height / 2 - (a.y + a.height / 2);
  const distance = Math.hypot(dx, dy);
  return { distance, ux: distance === 0 ? 0 : dx / distance, uy: distance === 0 ? 0 : dy / distance };
}

/**
 * The acceleration on each thing from the pull of all the others, in px per second per second. Each is pulled
 * towards every other thing, harder the heavier that other thing is, weakening with the square of the distance
 * between their centers. A thing's own mass doesn't change how fast it falls, just as on Earth: what it changes
 * is how hard it pulls everything else. Closer than touching, the pull stops growing (`collide` keeps them apart).
 */
export function pulls(things: Massive[]) {
  const accelerations = things.map(() => ({ ax: 0, ay: 0 }));
  things.forEach((a, i) => {
    things.slice(i + 1).forEach((b, offset) => {
      if (a.mass <= 0 || b.mass <= 0) return;
      const j = i + 1 + offset;
      const { distance, ux, uy } = between(a, b);
      if (distance === 0) return; // exactly on top of each other: no way to tell which way to pull
      const field = G / Math.max(distance, touching(a, b)) ** 2;
      accelerations[i]!.ax += field * b.mass * ux;
      accelerations[i]!.ay += field * b.mass * uy;
      accelerations[j]!.ax -= field * a.mass * ux;
      accelerations[j]!.ay -= field * a.mass * uy;
    });
  });
  return accelerations;
}

/**
 * Things with mass bump rather than pass through each other. Moves any two that overlap apart until they just
 * touch, and bounces them off each other, a little softly. The heavier one moves less, in proportion: a fixed
 * thing doesn't move at all, as if it were infinitely heavy.
 */
export function collide<Thing extends Moving>(things: Thing[]) {
  const moved = things.map((thing) => ({ ...thing }));
  moved.forEach((a, i) => {
    moved.slice(i + 1).forEach((b) => {
      if (a.mass <= 0 || b.mass <= 0 || (a.fixed && b.fixed)) return;
      const { distance, ux, uy } = between(a, b);
      const overlap = touching(a, b) - distance;
      if (overlap <= 0 || distance === 0) return;
      // How easy each is to move: the lighter, the easier
      const [easeA, easeB] = [a.fixed ? 0 : 1 / a.mass, b.fixed ? 0 : 1 / b.mass];
      const ease = easeA + easeB;
      a.x -= (ux * overlap * easeA) / ease;
      a.y -= (uy * overlap * easeA) / ease;
      b.x += (ux * overlap * easeB) / ease;
      b.y += (uy * overlap * easeB) / ease;
      // How fast they're moving into each other, along the line between them
      const closing = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
      if (closing <= 0) return;
      const impulse = ((1 + (closing < REST ? 0 : RESTITUTION)) * closing) / ease;
      a.vx -= ux * impulse * easeA;
      a.vy -= uy * impulse * easeA;
      b.vx += ux * impulse * easeB;
      b.vy += uy * impulse * easeB;
    });
  });
  return moved;
}

/**
 * The velocity that puts `thing` in a circular orbit around whichever of `others` pulls on it hardest, going
 * `direction` as you look at the screen, and carried along with it if that one is moving too. `null` when
 * nothing pulls on it.
 */
export function orbitVelocity(thing: Massive, others: Moving[], direction: OrbitDirection) {
  let strongest: { other: Moving; distance: number; ux: number; uy: number; pull: number } | null = null;
  for (const other of others) {
    if (other === thing || other.mass <= 0) continue;
    const { distance, ux, uy } = between(thing, other);
    if (distance === 0) continue;
    const pull = other.mass / distance ** 2;
    if (!strongest || pull > strongest.pull) strongest = { other, distance, ux, uy, pull };
  }
  if (!strongest) return null;
  const { other, distance, ux, uy } = strongest;
  const speed = Math.sqrt((G * other.mass) / distance);
  // At right angles to the line towards it. The screen's y axis points down, so turning (x, y) to (−y, x) goes clockwise.
  const [tx, ty] = direction === "clockwise" ? [uy, -ux] : [-uy, ux];
  return { vx: other.vx + tx * speed, vy: other.vy + ty * speed };
}
