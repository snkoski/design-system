import { useLayoutEffect, useRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
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
   * Hold still where it is. Anything that moves for more than five seconds needs a way to pause it (WCAG 2.2.2),
   * so a page that uses this should offer a pause button that sets this.
   */
  paused?: boolean;
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

/**
 * Something that travels around its box, or the whole screen, and bounces off the edges: a dot by default, or
 * whatever you put inside. Give it gravity to make it fall like a ball. Decorative: hidden from screen readers,
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
  onBounce,
  className,
  ref,
  ...rest
}: BounceProps) {
  const element = useRef<HTMLSpanElement | null>(null);
  const content = useRef<HTMLSpanElement | null>(null);
  const mover = useRef<Mover | null>(null);

  // Join the shared loop once; the effects below change the mover in place, so it keeps moving smoothly
  useLayoutEffect(() => {
    const created: Mover = {
      element: element.current!,
      body: { x: 0, y: 0, vx: 0, vy: 0 },
      physics: { gravity, bounciness },
      paused,
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
    current.physics = { gravity: Math.max(gravity, 0), bounciness };
    current.paused = paused;
    current.onBounce = (edges) => {
      if (squash) squashAgainst(content.current, edges[0]!);
      onBounce?.(edges);
    };
  });

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <span {...rest} ref={setRef} className={cx("bounce", className)} data-bounds={bounds} aria-hidden="true">
      <span ref={content} className="bounce__content">
        {children ?? <span className="bounce__dot" />}
      </span>
    </span>
  );
}
