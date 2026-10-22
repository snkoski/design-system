import { useLayoutEffect, useRef } from "react";
import { Bounce } from "../Bounce/Bounce";
import type { BounceProps } from "../Bounce/Bounce";
import { interact } from "../Bounce/mover";
import type { Interaction, Member } from "../Bounce/mover";
import { collide, orbitVelocity, pulls } from "./gravity";
import type { Moving, OrbitDirection } from "./gravity";

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
};

/** Each planet's mass and orbit, by its element, for the interaction to read */
const planets = new WeakMap<Element, { mass: number; orbit?: OrbitDirection; launched: boolean }>();
const massive = (members: Member[]) => members.map((member) => ({ ...member, mass: planets.get(member.element)?.mass ?? 0 }));

/**
 * Pull before moving; afterwards, send any planet waiting to orbit on its way, and bump overlapping ones apart.
 * Heavier planets are sent first, so a moon is sent off around its planet's new path, not where it stood still.
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
    return collide(things);
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
 * towards it, or, given an `orbit`, goes round and round it. It takes every Bounce prop as well, so it can bounce
 * off the walls, be grabbed and thrown into a new orbit, and so on. Decorative, like Bounce. An experiment: not
 * exported from the package (see CLAUDE.md, Experiments).
 */
export function Planet({ mass = 1, orbit, ref, ...rest }: PlanetProps) {
  const element = useRef<HTMLSpanElement | null>(null);

  // Bounce, a child, has already joined the loop by the time these run
  useLayoutEffect(() => join(), []);
  useLayoutEffect(() => {
    const planet = planets.get(element.current!);
    planets.set(element.current!, { mass, orbit, launched: planet?.launched ?? false });
  }, [mass, orbit]);
  // Sent off again from wherever it starts
  useLayoutEffect(() => {
    const planet = planets.get(element.current!);
    if (planet) planet.launched = false;
  }, [orbit, rest.startX, rest.startY, rest.bounds]);

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return <Bounce {...rest} ref={setRef} />;
}
