import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { useLoadingAnnouncement } from "../../internal/useLoadingAnnouncement";
import { hasContent, warn } from "../../internal/warn";

export type SkeletonProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "role"
  | "aria-live"
  | "aria-atomic"
  | "aria-busy"
  | "aria-label"
  | "aria-labelledby"
  | "aria-hidden"
  | "className"
> & {
  /**
   * What's loading, as plain text that ends with an ellipsis: "Loading applications…". Never shown: screen readers
   * announce it once, since they can't see the shapes. Required: a skeleton that doesn't say what's loading tells a
   * screen reader user nothing.
   */
  label: string;
  /**
   * Milliseconds to wait before showing and announcing the skeleton, so a load that finishes quickly never flashes
   * it. Read once, when the skeleton appears: changing it later does nothing. Default: `0`.
   */
  delay?: number;
  /** The shapes (`SkeletonItem`), laid out with Tailwind to match the content that's coming. */
  children?: ReactNode;
  /** Applied to the `<div>`, for the layout of the shapes inside it, such as `grid gap-3`. */
  className?: string;
  /** Reaches the `<div>`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Gray shapes that stand in for content while it loads, when you know its layout: a list, a card, a table. Put the
 * shapes inside, as `SkeletonItem`s, laid out like the content. For content whose layout you don't know, use a
 * Spinner.
 *
 * Screen readers can't see the shapes, so they're hidden, and the label is announced instead, once, the way
 * Spinner does it: it's in the HTML from the start, visually hidden, so a page read before JavaScript runs still
 * says what's loading. Once JavaScript runs, that copy is hidden from screen readers too, and a visually hidden
 * `role="status"` region gets the same words a moment later, which screen readers announce.
 */
export function Skeleton({ label, delay = 0, className, style, ref, children, ...rest }: SkeletonProps) {
  if (!hasContent(label)) {
    warn("Skeleton", 'has an empty label, so screen readers hear nothing while it loads. Give it a label such as "Loading projects…".');
  }
  // The delay, read once, and the phase: "server" (the HTML before JavaScript), "waiting", then "announced"
  const { wait, phase } = useLoadingAnnouncement(delay);

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("skeleton", className)}
      data-delayed={wait > 0 || undefined}
      style={wait > 0 ? ({ ...style, "--skeleton-delay": `${wait}ms` } as CSSProperties) : style}
    >
      <span className="visually-hidden skeleton__label" aria-hidden={phase !== "server" || undefined}>
        {label}
      </span>
      <span className="visually-hidden skeleton__status" role="status">
        {phase === "announced" ? label : null}
      </span>
      {children}
    </div>
  );
}
