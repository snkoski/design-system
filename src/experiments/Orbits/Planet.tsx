import { useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Bounce } from "@/experiments/Bounce/Bounce";
import type { BounceProps } from "@/experiments/Bounce/Bounce";
import { interact } from "@/experiments/Bounce/mover";
import type { Interaction, Member } from "@/experiments/Bounce/mover";
import { collide, orbitVelocity, pulls } from "@/experiments/Orbits/gravity";
import type { Moving, OrbitDirection } from "@/experiments/Orbits/gravity";
import "@/experiments/Orbits/orbits.css";

export type { OrbitDirection };

export type PlanetProps = BounceProps & {
  /**
   * How heavy it is. Everything with mass pulls on everything else, harder the heavier it is, so a heavy planet
   * can hold moons and drag light planets off course, while a light one hardly disturbs anything. When two
   * collide, the heavier one is knocked aside less. A paused planet still pulls, like a star. Only planets in the
   * same box pull on each other, and they ignore a plain Bounce. Default: 1.
   */
  mass?: number;
  /**
   * Start in a circular orbit around whatever pulls on it hardest, going this way round. This replaces `speed`
   * and `angle` at the start. Without it, it starts at its own `speed` and `angle`, and falls inwards unless
   * that happens to be fast enough, and sideways enough, to orbit.
   */
  orbit?: OrbitDirection;
  /**
   * Draw a line behind it, showing where it's been in the last this many seconds, fading out towards the oldest
   * end. A couple of seconds shows which way it's heading; ten or so shows a whole orbit. Default: 0 (no trail).
   */
  trail?: number;
  /** The trail's color: any CSS color, such as `var(--brand)`. Default: `currentColor`. */
  trailColor?: string;
};

/** Each planet's mass and orbit, by its element, for the interaction to read */
const planets = new WeakMap<Element, { mass: number; orbit?: OrbitDirection; launched: boolean }>();
const massive = (members: Member[]) => members.map((member) => ({ ...member, mass: planets.get(member.element)?.mass ?? 0 }));

/** How many steps a trail fades in, oldest to newest: each is a line of its own, a little more opaque than the last */
const BANDS = 20;
/** How far a planet moves, in px, before its trail gets another point */
const SPACING = 3;

interface Point {
  time: number;
  x: number;
  y: number;
}

/** Each planet's trail, by its element: how long it lasts, where the planet's been, and the lines to draw it with */
const trails = new WeakMap<Element, { seconds: number; points: Point[]; lines: (SVGPolylineElement | null)[] }>();

/** Adds where a planet's center is now to its trail, forgets what's too old, and redraws it */
function extend(element: Element, x: number, y: number) {
  const trail = trails.get(element);
  if (!trail) return;
  const now = performance.now();
  const span = trail.seconds * 1000;
  const head = { time: now, x, y };
  trail.points = trail.points.filter((point) => point.time > now - span);
  const last = trail.points.at(-1);
  if (!last || Math.hypot(x - last.x, y - last.y) >= SPACING) trail.points.push(head);
  // Sort the points into bands by age, each band joined to the next so the line doesn't break between them
  const bands: string[][] = Array.from({ length: BANDS }, () => []);
  let previous: number | null = null;
  [...trail.points, head].forEach((point) => {
    const band = Math.min(Math.max(Math.floor((1 - (now - point.time) / span) * BANDS), 0), BANDS - 1);
    const at = `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    if (previous !== null && previous !== band) bands[previous]!.push(at);
    bands[band]!.push(at);
    previous = band;
  });
  trail.lines.forEach((line, band) => line?.setAttribute("points", bands[band]!.join(" ")));
}

/**
 * Pull before moving; afterwards, send any planet waiting to orbit on its way, bump overlapping ones apart, and
 * extend the trails. Heavier planets are sent first, so a moon is sent off around its planet's new path, not
 * where it stood still.
 */
const gravity: Interaction = {
  push: (members) => pulls(massive(members)),
  settle: (members) => {
    const things: (Moving & { element: Element })[] = massive(members);
    [...things]
      .sort((a, b) => b.mass - a.mass)
      .forEach((thing) => {
        const planet = planets.get(thing.element);
        if (!planet?.orbit || planet.launched || thing.fixed) return;
        const velocity = orbitVelocity(thing, things, planet.orbit);
        if (!velocity) return; // nothing to orbit yet: wait for something
        Object.assign(thing, velocity);
        planet.launched = true;
      });
    const settled = collide(things);
    settled.forEach(({ element, x, y, width, height }) => extend(element, x + width / 2, y + height / 2));
    return settled;
  },
};

// Gravity joins Bounce's loop while any planet is on the page
let count = 0;
let leave: (() => void) | null = null;
function join() {
  if (count++ === 0) leave = interact(gravity);
  return () => {
    if (--count > 0) return;
    leave?.();
    leave = null;
  };
}

/**
 * A Bounce with mass, pulled by gravity towards everything else with mass: put a Star in its box and it falls
 * towards it, or, given an `orbit`, goes round and round it. Give it a `trail` to see the path it's taking. It
 * takes every Bounce prop as well, so it can bounce off the walls, be grabbed and thrown into a new orbit, and so
 * on. Decorative, like Bounce. An experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function Planet({ mass = 1, orbit, trail = 0, trailColor = "currentColor", ref, ...rest }: PlanetProps) {
  const element = useRef<HTMLSpanElement | null>(null);
  const lines = useRef<(SVGPolylineElement | null)[]>([]);

  // Bounce, a child, has already joined the loop by the time these run
  useLayoutEffect(() => join(), []);
  useLayoutEffect(() => {
    const planet = planets.get(element.current!);
    planets.set(element.current!, { mass, orbit, launched: planet?.launched ?? false });
  }, [mass, orbit]);
  useLayoutEffect(() => {
    if (trail <= 0) {
      trails.delete(element.current!);
      return;
    }
    // A new length keeps the trail drawn so far
    trails.set(element.current!, { seconds: trail, points: trails.get(element.current!)?.points ?? [], lines: lines.current });
  }, [trail]);
  // Sent off again from wherever it starts, with a fresh trail rather than a line from where it was
  useLayoutEffect(() => {
    const planet = planets.get(element.current!);
    if (planet) planet.launched = false;
    const drawn = trails.get(element.current!);
    if (drawn) drawn.points = [];
  }, [orbit, rest.startX, rest.startY, rest.bounds]);

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <>
      {trail > 0 && (
        <svg className="orbit-trail" data-bounds={rest.bounds ?? "parent"} style={{ "--orbit-trail-color": trailColor } as CSSProperties} aria-hidden="true">
          {Array.from({ length: BANDS }, (_, band) => (
            <polyline
              key={band}
              ref={(node) => {
                lines.current[band] = node;
              }}
              strokeOpacity={(band + 1) / BANDS}
            />
          ))}
        </svg>
      )}
      <Bounce {...rest} ref={setRef} />
    </>
  );
}
