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
  onBounce: (edges: Edge[]) => void;
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
  const rooms = list.map((mover) => (still(mover) ? null : room(mover.element))); // read everything first
  const bounced: [Mover, Edge[]][] = [];
  list.forEach((mover, index) => {
    const space = rooms[index];
    if (!space) return;
    const { body, edges } = step(mover.body, space, seconds, mover.physics);
    mover.body = body;
    place(mover); // then write
    if (edges.length > 0) bounced.push([mover, edges]);
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
