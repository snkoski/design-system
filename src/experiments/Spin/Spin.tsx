import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "../decoration.css";
import "./spin.css";

export type SpinDirection = "clockwise" | "counterclockwise";

export interface SpinProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** What spins: a bar, an emoji, an icon, or anything else. Hidden from screen readers; `label` names the button. */
  children: ReactNode;
  /** How fast it spins, in turns per second (on average, with an easing that slows down). Default: 2. */
  speed?: number;
  /** How long one spin lasts, in milliseconds. Default: 1000. */
  duration?: number;
  /**
   * The easing of a spin, as a CSS timing function. The default, `var(--ease-out)`, starts fast and slows to a
   * stop, like a spun wheel; `linear` keeps one speed and stops dead.
   */
  easing?: string;
  /** Which way it spins. Default: `clockwise`. */
  direction?: SpinDirection;
  /**
   * Land the right way up, by rounding each spin up to whole turns. Turn it off to stop wherever the spin ends.
   * Default: `true`.
   */
  upright?: boolean;
  /** What a screen reader announces for the button. Default: "Spin". */
  label?: string;
  /** Applied to the button, so it's the place for layout classes such as size or margin. */
  className?: string;
  /** Reaches the button. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A button that spins its content when it's clicked (or pressed with Space or Enter). Click again while it's
 * spinning to add more spin from where it is. Decorative motion, so with reduced motion it doesn't spin. An
 * experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function Spin({
  children,
  speed = 2,
  duration = 1000,
  easing,
  direction = "clockwise",
  upright = true,
  label = "Spin",
  className,
  style,
  onClick,
  ...rest
}: SpinProps) {
  // The angle it's spinning to; a CSS transition turns it there from wherever it is now
  const [angle, setAngle] = useState(0);
  const time = Math.max(duration, 0);

  const spin = () => {
    const turns = Math.max(speed, 0) * (time / 1000);
    const sign = direction === "clockwise" ? 1 : -1;
    setAngle((current) => {
      const next = current + sign * turns * 360;
      if (!upright) return next;
      // Round away from the start, so it always finishes the turn it's on
      return (sign > 0 ? Math.ceil(next / 360) : Math.floor(next / 360)) * 360;
    });
  };

  return (
    <button
      type="button"
      aria-label={label}
      {...rest}
      className={cx("spin", className)}
      data-direction={direction}
      style={
        {
          ...style,
          "--spin-angle": `${angle}deg`,
          "--spin-duration": `${time}ms`,
          ...(easing && { "--spin-ease": easing }),
        } as CSSProperties
      }
      onClick={(event) => {
        spin();
        onClick?.(event);
      }}
    >
      <span className="spin__content" aria-hidden="true">
        {children}
      </span>
    </button>
  );
}
