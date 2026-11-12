import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/internal/cx";

export type SkeletonShape = "text" | "box" | "circle";

type SharedProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-hidden" | "className"> & {
  /** Applied to the `<span>`, for its size (`h-32`, `size-10`) or width (`w-1/2`). */
  className?: string;
  /** Reaches the `<span>`. */
  ref?: Ref<HTMLSpanElement>;
};

export type SkeletonItemProps = SharedProps &
  (
    | {
        /**
         * The shape. `text` is one or more lines of the text around it: put it in the same text style as the text
         * it stands in for. In a flex row it has no width of its own: add `flex-1` or a width class. Default:
         * `text`.
         */
        shape?: "text";
        /** How many lines of text. The last is shorter when there are two or more. Default: `1`. */
        lines?: number;
      }
    | {
        /**
         * `box` is a rectangle as wide as its container, for an image or a card; set its height with a class such as
         * `h-32`. In a flex row it has no width of its own: add `flex-1` or a width class. `circle` is for an avatar;
         * set its size with a class such as `size-10`. Either one with no size is one line tall.
         */
        shape: "box" | "circle";
        /** Only text has lines. */
        lines?: never;
      }
  );

/**
 * One gray shape in a `Skeleton`: lines of text, a box, or a circle. Always hidden from screen readers: the
 * Skeleton around it says what's loading.
 */
export function SkeletonItem({ shape = "text", lines = 1, className, ref, ...rest }: SkeletonItemProps) {
  // A whole number of lines, at least one, whatever arrives
  const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 1;
  return (
    <span {...rest} ref={ref} className={cx("skeleton-item", className)} data-shape={shape} aria-hidden="true">
      {shape === "text"
        ? Array.from({ length: count }, (_, index) => <span key={index} className="skeleton-item__line" />)
        : null}
    </span>
  );
}
