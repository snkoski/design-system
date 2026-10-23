/**
 * The real distances don't fit on a screen: Pluto gets 127 times as far from the Sun as Mercury's average distance. These
 * squeeze them, from 0 (the Sun) to 1 (`outermost`, the furthest anything gets), always keeping the order, so
 * nearer the Sun stays nearer.
 *
 * - `linear`: true to scale. The inner four crowd round the Sun.
 * - `sqrt`: by the square root. Still roughly to scale, and the inner planets get some room.
 * - `log`: by the logarithm. Each step outwards gets about the same room, however far it is.
 * - `even`: each planet's orbit evenly spaced, like a diagram, and in between in proportion.
 */
export type DistanceScale = "linear" | "sqrt" | "log" | "even";

/**
 * A function from a real distance from the Sun, in AU, to how far out to draw it, from 0 to 1. `rings` are the
 * planets' average distances (semi-major axes), nearest first, which `log` and `even` are based on.
 */
export function scaleDistance(kind: DistanceScale, rings: number[], outermost: number): (distance: number) => number {
  if (kind === "linear") return (distance) => distance / outermost;
  if (kind === "sqrt") return (distance) => Math.sqrt(distance / outermost);
  if (kind === "log") {
    const unit = rings[0]! / 2; // so the nearest orbit gets a fair share of the room
    return (distance) => Math.log1p(distance / unit) / Math.log1p(outermost / unit);
  }
  // even: ring i is drawn at step i + 1, in a straight line from one ring to the next, and on past the last
  const step = (distance: number) => {
    if (distance <= rings[0]!) return distance / rings[0]!;
    let index = rings.findIndex((ring) => ring >= distance) - 1;
    if (index < 0) index = rings.length - 2; // past the last ring: carry on at the last gap's rate
    return index + 1 + (distance - rings[index]!) / (rings[index + 1]! - rings[index]!);
  };
  const end = step(outermost);
  return (distance) => step(distance) / end;
}
