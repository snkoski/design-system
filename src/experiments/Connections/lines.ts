export type DistanceUnit = "px" | "vw" | "vh" | "vmin" | "vmax" | "rem";
/** A distance in px, or a length such as `"15vw"`, `"10vmin"`, or `"8rem"` */
export type Distance = number | `${number}${DistanceUnit}`;

/** The size of the window and the root font, which relative units are measured against */
export interface Scale {
  width: number;
  height: number;
  rem: number;
}

/** `distance` in px. Anything it can't read counts as 0, so no lines are drawn. */
export function toPixels(distance: Distance, { width, height, rem }: Scale) {
  if (typeof distance === "number") return Math.max(distance, 0);
  // A plain number with no unit (as typed into a text box) is px too
  const match = /^(-?[\d.]+)(px|vw|vh|vmin|vmax|rem)?$/.exec(distance.trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const per: Record<DistanceUnit, number> = {
    px: 1,
    vw: width / 100,
    vh: height / 100,
    vmin: Math.min(width, height) / 100,
    vmax: Math.max(width, height) / 100,
    rem,
  };
  return Number.isFinite(value) ? Math.max(value * per[(match[2] ?? "px") as DistanceUnit], 0) : 0;
}

/** An element's box, in px from the container's top left corner */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Line {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 1 when the boxes touch, fading towards 0 as the gap reaches the distance */
  strength: number;
}

/** The gap between two boxes' nearest edges: 0 when they touch or overlap */
export function gap(a: Box, b: Box) {
  const dx = Math.max(0, Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)) - (a.width + b.width) / 2);
  const dy = Math.max(0, Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) - (a.height + b.height) / 2);
  return Math.hypot(dx, dy);
}

/** A line between the centers of every pair of boxes whose gap is under `distance` */
export function lines(boxes: Box[], distance: number) {
  const found: Line[] = [];
  if (distance <= 0) return found;
  boxes.forEach((a, index) => {
    boxes.slice(index + 1).forEach((b) => {
      const between = gap(a, b);
      if (between >= distance) return;
      found.push({
        from: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
        to: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
        strength: 1 - between / distance,
      });
    });
  });
  return found;
}
