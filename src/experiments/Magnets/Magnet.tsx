import { useLayoutEffect, useRef } from "react";
import { Bounce } from "../Bounce/Bounce";
import type { BounceProps } from "../Bounce/Bounce";
import { interact } from "../Bounce/mover";
import type { Interaction, Member } from "../Bounce/mover";
import { forces, separate } from "./forces";

export type MagnetProps = BounceProps & {
  /**
   * Like a magnetic charge: magnets with opposite charges (1 and -1) attract, and ones with the same sign repel,
   * harder the bigger the charge and the closer they are. They touch rather than pass through each other. 0 is
   * neutral. A paused magnet still pulls and pushes, like a fixed magnet. Only magnets in the same box affect
   * each other, and they ignore a plain Bounce. Default: 1.
   */
  charge?: number;
};

/** Each magnet's charge, by its element, for the interaction to read */
const charges = new WeakMap<Element, number>();
const charged = (members: Member[]) => members.map((member) => ({ ...member, charge: charges.get(member.element) ?? 0 }));

/** Attract and repel before moving; then move overlapping magnets apart so they touch */
const magnetism: Interaction = {
  push: (members) => forces(charged(members)),
  settle: (members) => separate(charged(members)),
};

// Magnetism joins Bounce's loop while any magnet is on the page
let magnets = 0;
let leave: (() => void) | null = null;
function join() {
  if (magnets++ === 0) leave = interact(magnetism);
  return () => {
    if (--magnets > 0) return;
    leave?.();
    leave = null;
  };
}

/**
 * A Bounce with a charge, like a magnet: opposite charges attract and like charges repel, so magnets pair up,
 * clump, or keep their distance. It takes every Bounce prop as well, so it can bounce, fall, be grabbed and
 * thrown, and so on; `friction` lets magnets settle instead of swinging past each other. Decorative, like
 * Bounce. An experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function Magnet({ charge = 1, ref, ...rest }: MagnetProps) {
  const element = useRef<HTMLSpanElement | null>(null);

  // Bounce, a child, has already joined the loop by the time these run
  useLayoutEffect(() => join(), []);
  useLayoutEffect(() => {
    charges.set(element.current!, charge);
  }, [charge]);

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return <Bounce {...rest} ref={setRef} data-charge={charge > 0 ? "positive" : charge < 0 ? "negative" : "neutral"} />;
}
