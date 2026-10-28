/** Something with a charge, where it is (its top left corner, in px), and its size */
export interface Charged {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Opposite charges attract and like charges repel, harder the bigger they are. 0 is neutral. */
  charge: number;
}

/** How hard two charges of 1 pull or push: the acceleration at 100px apart is PULL / 100², 600px per second per second */
export const PULL = 6_000_000;

/** Roughly the distance between two things' centers when they touch */
function touching(a: Charged, b: Charged) {
  return (a.width + b.width + a.height + b.height) / 4;
}

/**
 * The acceleration on each charged thing from all the others, in px per second per second. Opposite charges
 * attract and like charges repel, weakening with the square of the distance between their centers. Closer than
 * touching, it stops growing (`separate` keeps them from overlapping).
 */
export function forces(things: Charged[]) {
  const pushes = things.map(() => ({ ax: 0, ay: 0 }));
  things.forEach((a, i) => {
    things.slice(i + 1).forEach((b, offset) => {
      if (a.charge === 0 || b.charge === 0) return;
      const j = i + 1 + offset;
      const dx = b.x + b.width / 2 - (a.x + a.width / 2);
      const dy = b.y + b.height / 2 - (a.y + a.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance === 0) return; // exactly on top of each other: no way to tell which way to push
      // Positive pushes apart (like charges), negative pulls together (opposites)
      const apart = (PULL * a.charge * b.charge) / Math.max(distance, touching(a, b)) ** 2;
      const [ux, uy] = [dx / distance, dy / distance];
      pushes[i]!.ax -= apart * ux;
      pushes[i]!.ay -= apart * uy;
      pushes[j]!.ax += apart * ux;
      pushes[j]!.ay += apart * uy;
    });
  });
  return pushes;
}

/** A charged thing that's moving, or `fixed` in place (paused, held, or under reduced motion) */
export interface Solid extends Charged {
  vx: number;
  vy: number;
  fixed: boolean;
}

/**
 * Charged things touch rather than pass through each other. Moves any two that overlap apart until they just
 * touch (sharing the move, unless one is fixed), and stops them moving further into each other.
 */
export function separate(things: Solid[]) {
  const moved = things.map((thing) => ({ ...thing }));
  moved.forEach((a, i) => {
    moved.slice(i + 1).forEach((b) => {
      if (a.charge === 0 || b.charge === 0 || (a.fixed && b.fixed)) return;
      const dx = b.x + b.width / 2 - (a.x + a.width / 2);
      const dy = b.y + b.height / 2 - (a.y + a.height / 2);
      const distance = Math.hypot(dx, dy);
      const overlap = touching(a, b) - distance;
      if (overlap <= 0 || distance === 0) return;
      const [ux, uy] = [dx / distance, dy / distance];
      const [shareA, shareB] = a.fixed ? [0, 1] : b.fixed ? [1, 0] : [0.5, 0.5];
      a.x -= ux * overlap * shareA;
      a.y -= uy * overlap * shareA;
      b.x += ux * overlap * shareB;
      b.y += uy * overlap * shareB;
      // How fast they're moving into each other, along the line between them
      const closing = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
      if (closing <= 0) return;
      a.vx -= ux * closing * shareA;
      a.vy -= uy * closing * shareA;
      b.vx += ux * closing * shareB;
      b.vy += uy * closing * shareB;
    });
  });
  return moved;
}
