import { useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, PointerEvent, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "../decoration.css";
import "./bounce.css";
import { move, place, room } from "./mover";
import type { Mover } from "./mover";
import { velocity } from "./physics";
import type { Edge } from "./physics";

export type { Edge };
export type BounceBounds = "parent" | "viewport";

interface OwnProps {
  /** What bounces: an emoji, an icon, a shape, or anything else. Default: a small round dot. Hidden from screen readers. */
  children?: ReactNode;
  /** How fast it starts, in px per second. Default: 240. */
  speed?: number;
  /** Which way it starts, in degrees: 0 is right, 90 is down, 180 is left, 270 is up. Default: 45 (down and right). */
  angle?: number;
  /** A downward pull, in px per second per second, so it falls and bounces like a ball. Default: 0 (it floats). */
  gravity?: number;
  /** How much speed it keeps at each bounce, from 0 (stops dead) to 1 (keeps it all). Default: 1. */
  bounciness?: number;
  /** Where it starts across its box, from 0 (left) to 1 (right). Default: 0. */
  startX?: number;
  /** Where it starts down its box, from 0 (top) to 1 (bottom). Default: 0. */
  startY?: number;
  /**
   * What it bounces around in. `parent` is its nearest positioned parent (give it `position: relative`), or the
   * viewport if it has none; `viewport` is the whole window, over the page. Default: `parent`.
   */
  bounds?: BounceBounds;
  /** Squash against each edge it hits. Default: `true`. */
  squash?: boolean;
  /**
   * How quickly it slows down by itself, per second: 0 keeps going forever, 1 loses about two thirds of its speed
   * each second. Default: 0.
   */
  friction?: number;
  /**
   * Hold still where it is. Anything that moves for more than five seconds needs a way to pause it (WCAG 2.2.2),
   * so a page that uses this should offer a pause button that sets this.
   */
  paused?: boolean;
  /**
   * Let people pick it up and drag it with a mouse, pen, or finger. It then catches clicks instead of letting them
   * pass through. Default: `false`.
   */
  grabbable?: boolean;
  /**
   * When `grabbable`, let go mid-drag to throw it: it flies off at the speed it was moving. Turn it off and it
   * stays where it's dropped (with no gravity). Default: `true`.
   */
  throwable?: boolean;
  /**
   * Called when it's clicked: pressed and let go without dragging it. Needs `grabbable` (or `pointer-events` turned
   * back on), since otherwise clicks pass through it.
   */
  onClick?: HTMLAttributes<HTMLSpanElement>["onClick"];
  /** Called at each bounce, with the edge it hit (two edges in a corner). */
  onBounce?: (edges: Edge[]) => void;
  /** Applied to the moving element. It sets its own position, so use this for things like `z-index`. */
  className?: string;
  /** Reaches the moving element. */
  ref?: Ref<HTMLSpanElement>;
}

export type BounceProps = OwnProps & Omit<HTMLAttributes<HTMLSpanElement>, keyof OwnProps>;

const SQUASH: Record<Edge, Keyframe> = {
  left: { transform: "scale(0.7, 1.2)", transformOrigin: "left center" },
  right: { transform: "scale(0.7, 1.2)", transformOrigin: "right center" },
  top: { transform: "scale(1.2, 0.7)", transformOrigin: "center top" },
  bottom: { transform: "scale(1.2, 0.7)", transformOrigin: "center bottom" },
};

/** Squashes `content` flat against `edge`, then lets it spring back */
function squashAgainst(content: HTMLElement | null, edge: Edge) {
  const squashed = SQUASH[edge];
  // jsdom has no Web Animations
  content?.animate?.([squashed, { transform: "none", transformOrigin: squashed.transformOrigin }], { duration: 240, easing: "ease-out" });
}

/** Only the pointer's last moments count towards a throw, in milliseconds, so holding still and letting go drops it */
const THROW_WINDOW = 100;
/** The fastest throw, in px per second */
const MAX_THROW = 5000;
/** How far the pointer can wander, in px, and the press still count as a click rather than a drag */
const CLICK_SLOP = 4;

interface Sample {
  time: number;
  x: number;
  y: number;
}

/** The velocity of the drag over its last moments, from position samples */
function throwVelocity(samples: Sample[], now: number) {
  const recent = samples.filter((sample) => sample.time >= now - THROW_WINDOW);
  const first = recent[0];
  const last = recent.at(-1);
  if (!first || !last || last.time === first.time) return { vx: 0, vy: 0 };
  const seconds = (last.time - first.time) / 1000;
  const limit = (value: number) => Math.min(Math.max(value, -MAX_THROW), MAX_THROW);
  return { vx: limit((last.x - first.x) / seconds), vy: limit((last.y - first.y) / seconds) };
}

/**
 * Something that travels around its box, or the whole screen, and bounces off the edges: a dot by default, or
 * whatever you put inside. Give it gravity to make it fall like a ball, and make it grabbable to drag it
 * around and throw it. Decorative: hidden from screen readers,
 * and clicks pass straight through it. With reduced motion it holds still. An experiment: not exported from the
 * package (see CLAUDE.md, Experiments).
 */
export function Bounce({
  children,
  speed = 240,
  angle = 45,
  gravity = 0,
  bounciness = 1,
  startX = 0,
  startY = 0,
  bounds = "parent",
  squash = true,
  paused = false,
  friction = 0,
  grabbable = false,
  throwable = true,
  onBounce,
  className,
  ref,
  ...rest
}: BounceProps) {
  const element = useRef<HTMLSpanElement | null>(null);
  const content = useRef<HTMLSpanElement | null>(null);
  const mover = useRef<Mover | null>(null);
  // While dragging: where the pointer and the body started, and where it's been lately
  const drag = useRef<{ pointer: number; fromX: number; fromY: number; startX: number; startY: number; samples: Sample[] } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Whether the last press dragged it, so letting go isn't also a click
  const dragged = useRef(false);

  // Join the shared loop once; the effects below change the mover in place, so it keeps moving smoothly
  useLayoutEffect(() => {
    const created: Mover = {
      element: element.current!,
      body: { x: 0, y: 0, vx: 0, vy: 0 },
      physics: { gravity, bounciness },
      paused,
      held: false,
      onBounce: () => {},
    };
    mover.current = created;
    const stop = move(created);
    return () => {
      stop();
      mover.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const current = mover.current!;
    const space = room(current.element);
    const fraction = (value: number) => Math.min(Math.max(value, 0), 1);
    current.body = { ...current.body, x: fraction(startX) * Math.max(space.width, 0), y: fraction(startY) * Math.max(space.height, 0) };
    place(current);
  }, [startX, startY, bounds]);

  useLayoutEffect(() => {
    const current = mover.current!;
    current.body = { ...current.body, ...velocity(speed, angle) };
  }, [speed, angle]);

  useLayoutEffect(() => {
    const current = mover.current!;
    current.physics = { gravity: Math.max(gravity, 0), bounciness, friction };
    current.paused = paused;
    current.onBounce = (edges) => {
      if (squash) squashAgainst(content.current, edges[0]!);
      onBounce?.(edges);
    };
  });

  const grab = (event: PointerEvent<HTMLSpanElement>) => {
    const current = mover.current;
    if (!grabbable || !current || event.button !== 0) return;
    event.preventDefault(); // no text selection or native image drag
    // A synthetic pointer (in tests) has no capture to take
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    current.held = true;
    dragged.current = false;
    const { x, y } = current.body;
    drag.current = { pointer: event.pointerId, fromX: event.clientX, fromY: event.clientY, startX: x, startY: y, samples: [{ time: performance.now(), x, y }] };
    setDragging(true);
  };

  const pull = (event: PointerEvent<HTMLSpanElement>) => {
    const current = mover.current;
    const held = drag.current;
    if (!current || !held || event.pointerId !== held.pointer) return;
    if (Math.hypot(event.clientX - held.fromX, event.clientY - held.fromY) > CLICK_SLOP) dragged.current = true;
    const space = room(current.element);
    const x = Math.min(Math.max(held.startX + event.clientX - held.fromX, 0), Math.max(space.width, 0));
    const y = Math.min(Math.max(held.startY + event.clientY - held.fromY, 0), Math.max(space.height, 0));
    current.body = { ...current.body, x, y };
    held.samples = [...held.samples.filter((sample) => sample.time >= performance.now() - THROW_WINDOW), { time: performance.now(), x, y }];
    place(current);
  };

  const release = (event: PointerEvent<HTMLSpanElement>) => {
    const current = mover.current;
    const held = drag.current;
    if (!current || !held || event.pointerId !== held.pointer) return;
    const now = performance.now();
    const { x, y } = current.body;
    current.body = { x, y, ...(throwable ? throwVelocity([...held.samples, { time: now, x, y }], now) : { vx: 0, vy: 0 }) };
    current.held = false;
    drag.current = null;
    setDragging(false);
  };

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <span
      {...rest}
      ref={setRef}
      className={cx("bounce", className)}
      data-bounds={bounds}
      data-grabbable={grabbable || undefined}
      data-dragging={dragging || undefined}
      aria-hidden="true"
      onPointerDown={(event) => {
        grab(event);
        rest.onPointerDown?.(event);
      }}
      onPointerMove={(event) => {
        pull(event);
        rest.onPointerMove?.(event);
      }}
      onPointerUp={(event) => {
        release(event);
        rest.onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        release(event);
        rest.onPointerCancel?.(event);
      }}
      onClick={(event) => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        rest.onClick?.(event);
      }}
    >
      <span ref={content} className="bounce__content">
        {children ?? <span className="bounce__dot" />}
      </span>
    </span>
  );
}
