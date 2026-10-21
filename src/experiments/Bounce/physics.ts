/** Where a bouncing thing is, in px from its box's top left corner, and how fast it's going, in px per second */
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** How far it can travel: its box's size minus its own size, in px */
export interface Room {
  width: number;
  height: number;
}

export interface Physics {
  /** Downward pull, in px per second per second. 0 floats. */
  gravity: number;
  /** How much speed is kept at each bounce: 1 keeps it all, 0 stops dead. */
  bounciness: number;
  /** How quickly it slows down by itself, per second: 0 never does, 1 loses about two thirds of its speed a second. */
  friction?: number;
}

export type Edge = "top" | "right" | "bottom" | "left";

/** Under gravity, a bounce slower than this many seconds' worth of gravity counts as resting on the floor */
const REST = 0.05;

/** The velocity for a speed in px per second and an angle in degrees: 0 is right, 90 is down */
export function velocity(speed: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { vx: Math.max(speed, 0) * Math.cos(radians), vy: Math.max(speed, 0) * Math.sin(radians) };
}

/** Moves `body` on by `seconds`, bouncing it off the room's edges, and says which edges it hit */
export function step(body: Body, room: Room, seconds: number, { gravity, bounciness, friction = 0 }: Physics) {
  const keep = Math.min(Math.max(bounciness, 0), 1);
  const maxX = Math.max(room.width, 0);
  const maxY = Math.max(room.height, 0);
  const slow = Math.exp(-Math.max(friction, 0) * seconds);
  let vx = body.vx * slow;
  let vy = body.vy * slow;
  vy += gravity * seconds;
  let x = body.x + vx * seconds;
  let y = body.y + vy * seconds;
  const edges: Edge[] = [];

  // With no room to move in a direction, it sits still that way instead of bouncing every frame
  if (maxX === 0) {
    x = 0;
  } else if (x <= 0 && vx < 0) {
    x = 0;
    vx = -vx * keep;
    edges.push("left");
  } else if (x >= maxX && vx > 0) {
    x = maxX;
    vx = -vx * keep;
    edges.push("right");
  } else {
    x = Math.min(Math.max(x, 0), maxX);
  }

  if (maxY === 0) {
    y = 0;
  } else if (y <= 0 && vy < 0) {
    y = 0;
    vy = -vy * keep;
    edges.push("top");
  } else if (y >= maxY && vy > 0) {
    y = maxY;
    // Landing too gently to bounce: it rests on the floor, rather than bouncing a tiny amount every frame
    if (gravity > 0 && vy < gravity * REST) {
      vy = 0;
    } else {
      vy = -vy * keep;
      edges.push("bottom");
    }
  } else {
    y = Math.min(Math.max(y, 0), maxY);
  }

  return { body: { x, y, vx, vy }, edges };
}
