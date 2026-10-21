import { useEffect, useRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "../decoration.css";
import "./look-at.css";
import { reaim, watch } from "./tracker";
import type { Watcher } from "./tracker";

export type LookAtDirection = "toward" | "away";

interface OwnProps {
  /** Whether the content faces toward the mouse or away from it. Default: `toward`. */
  direction?: LookAtDirection;
  /**
   * How long each turn takes, in milliseconds. 0 snaps straight to the mouse; longer ones trail behind it
   * lazily. Default: 120 (`--duration-fast`).
   */
  turnDuration?: number;
  /** The easing of each turn, as a CSS timing function, such as `var(--ease-in-out)` or `linear`. Default: `var(--ease-out)`. */
  turnEasing?: string;
  /**
   * What turns to face the mouse, drawn pointing up: an up arrow, a vertical bar, and so on. It's hidden from
   * screen readers, because the turning is decoration.
   */
  children: ReactNode;
  /** Applied to the outer element, so it's the place for layout classes such as size or margin. */
  className?: string;
  /** Reaches the outer element, whose center the content turns around. */
  ref?: Ref<HTMLSpanElement>;
}

export type LookAtProps = OwnProps & Omit<HTMLAttributes<HTMLSpanElement>, keyof OwnProps | "children">;

/**
 * Turns its content to face the mouse (or away from it). Each LookAt aims from its own center, so in a grid of
 * them, every one points its own way: with the mouse in the middle, they all point in toward it. Decorative and
 * hidden from screen readers; with reduced motion the content stays pointing up. An experiment: not exported
 * from the package (see CLAUDE.md, Experiments).
 */
export function LookAt({ direction = "toward", turnDuration, turnEasing, className, style, ref, children, ...rest }: LookAtProps) {
  const element = useRef<HTMLSpanElement | null>(null);
  const watcher = useRef<Watcher | null>(null);

  useEffect(() => {
    watcher.current = { element: element.current!, away: direction === "away", angle: 0 };
    const stop = watch(watcher.current);
    return () => {
      stop();
      watcher.current = null;
    };
    // Subscribe once; a direction change is handled below without losing the current angle
  }, []);

  useEffect(() => {
    if (!watcher.current) return;
    watcher.current.away = direction === "away";
    reaim(watcher.current);
  }, [direction]);

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <span
      {...rest}
      ref={setRef}
      className={cx("look-at", className)}
      data-direction={direction}
      aria-hidden="true"
      style={{
        ...style,
        ...(turnDuration !== undefined && { "--look-at-duration": `${Math.max(turnDuration, 0)}ms` }),
        ...(turnEasing && { "--look-at-ease": turnEasing }),
      }}
    >
      <span className="look-at__pointer">{children}</span>
    </span>
  );
}
