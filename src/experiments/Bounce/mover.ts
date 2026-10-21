import { step } from "./physics";
import type { Body, Edge, Physics, Room } from "./physics";

/**
 * One shared animation frame loop moves every Bounce on the page. Each frame it measures every one first, then
 * moves them all, so the browser doesn't have to recalculate layout between them.
 */
export interface Mover {
  /** The element to measure and move */
  element: HTMLElement;
  body: Body;
  physics: Physics;
  /** Hold still. Reduced motion (`--experiment-decoration: 0`) holds it still too. */
  paused: boolean;
  /** Being dragged: the pointer moves it, not the loop */
  held: boolean;
  onBounce: (edges: Edge[]) => void;
}

/** A mover as an interaction sees it: where it is, how fast it's going, its size, and whether it's held in place */
export interface Member {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  /** Paused, held, or under reduced motion: it isn't moving this frame, though it can still act on others */
  fixed: boolean;
}

/**
 * Something that acts between the movers in one box, which another experiment adds (Magnets does). Bounce on its
 * own has none. Each frame, for each box: `push` before they move, returning an acceleration for each member in
 * px per second per second; then `settle` after they've moved, returning where each member should be instead
 * (for example, so they touch rather than overlap). Each returns one entry per member, in the same order.
 */
export interface Interaction {
  push?: (members: Member[]) => { ax: number; ay: number }[];
  settle?: (members: Member[]) => { x: number; y: number; vx: number; vy: number }[];
}

const interactions = new Set<Interaction>();

/** Adds an interaction between movers, and returns the function that removes it */
export function interact(interaction: Interaction) {
  interactions.add(interaction);
  return () => {
    interactions.delete(interaction);
  };
}

/** The longest step taken in one frame, in seconds, so it doesn't leap after the tab was in the background */
const MAX_STEP = 0.05;

const movers = new Set<Mover>();
let frame = 0;
let last: number | null = null;

/** How far `element` can travel: inside its positioned parent, or the viewport when it has none (or is fixed) */
export function room(element: HTMLElement): Room {
  const box = element.offsetParent;
  const viewport = !box || box === document.body;
  const width = viewport ? document.documentElement.clientWidth : box.clientWidth;
  const height = viewport ? document.documentElement.clientHeight : box.clientHeight;
  return { width: width - element.offsetWidth, height: height - element.offsetHeight };
}

/** Puts the element where its body is */
export function place(mover: Mover) {
  mover.element.style.transform = `translate(${mover.body.x}px, ${mover.body.y}px)`;
}

function still(mover: Mover) {
  return mover.paused || getComputedStyle(mover.element).getPropertyValue("--experiment-decoration").trim() === "0";
}

function tick(now: number) {
  frame = 0;
  const seconds = last === null ? 0 : Math.min((now - last) / 1000, MAX_STEP);
  last = now;
  const list = [...movers];

  // Read everything first
  const fixed = list.map((mover) => mover.held || still(mover));
  const rooms = list.map((mover, index) => (fixed[index] ? null : room(mover.element)));
  const sizes = list.map(({ element }) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  // Movers grouped by the box they're in, for interactions: only those in the same box affect each other
  const boxes = new Map<Element | null, number[]>();
  if (interactions.size > 0) {
    list.forEach((mover, index) => {
      const parent = mover.element.offsetParent;
      const box = parent === document.body ? null : parent; // both mean the viewport
      boxes.set(box, [...(boxes.get(box) ?? []), index]);
    });
  }
  const members = (indexes: number[]): Member[] =>
    indexes.map((index) => ({ element: list[index]!.element, ...list[index]!.body, ...sizes[index]!, fixed: fixed[index]! }));

  // Interactions push, then everything moves
  const pushes = list.map(() => ({ ax: 0, ay: 0 }));
  interactions.forEach(({ push }) => {
    if (!push) return;
    boxes.forEach((indexes) => {
      push(members(indexes)).forEach(({ ax, ay }, member) => {
        pushes[indexes[member]!]!.ax += ax;
        pushes[indexes[member]!]!.ay += ay;
      });
    });
  });
  const bounced: [Mover, Edge[]][] = [];
  list.forEach((mover, index) => {
    const space = rooms[index];
    if (!space) return;
    const { ax, ay } = pushes[index]!;
    const pushed = { ...mover.body, vx: mover.body.vx + ax * seconds, vy: mover.body.vy + ay * seconds };
    const { body, edges } = step(pushed, space, seconds, mover.physics);
    mover.body = body;
    if (edges.length > 0) bounced.push([mover, edges]);
  });

  // Interactions settle where things end up, inside their box
  interactions.forEach(({ settle }) => {
    if (!settle) return;
    boxes.forEach((indexes) => {
      settle(members(indexes)).forEach(({ x, y, vx, vy }, member) => {
        const index = indexes[member]!;
        const space = rooms[index];
        if (!space) return; // fixed: stays put
        const inside = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));
        list[index]!.body = { x: inside(x, space.width), y: inside(y, space.height), vx, vy };
      });
    });
  });

  // Then write
  list.forEach((mover, index) => {
    if (rooms[index]) place(mover);
  });
  bounced.forEach(([mover, edges]) => mover.onBounce(edges)); // last, as these can read layout or re-render
  if (movers.size > 0 && !frame) frame = requestAnimationFrame(tick);
}

/** Starts moving `mover`, and returns the function that stops it */
export function move(mover: Mover) {
  movers.add(mover);
  if (!frame) frame = requestAnimationFrame(tick);
  return () => {
    movers.delete(mover);
    if (movers.size === 0) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = null;
    }
  };
}
