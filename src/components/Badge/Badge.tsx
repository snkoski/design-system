import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";
/** Plain text and numbers, alone or mixed, as in `{count} new`. */
export type BadgeText = string | number | ReadonlyArray<string | number>;

export type BadgeProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "role" | "tabIndex" | "aria-live" | "aria-atomic" | "aria-label" | "aria-labelledby" | "className"
> & {
  /**
   * The words: a short state or kind in sentence case, such as "Offer", "Needs review", or "3 new". Plain text and
   * numbers only, so nothing clickable ends up inside. Name what a number counts: "3 new", not "3".
   */
  children: BadgeText;
  /**
   * What the badge means. `neutral` is gray and suits most badges, told apart by their words. `success`, `warning`,
   * and `danger` color the words, icon, and fill, for a state that went well, needs attention, or went wrong.
   * Default: `neutral`.
   */
  tone?: BadgeTone;
  /** `md` is 14px text, beside body text. `sm` is 12px text, for tight spots such as table rows. Default: `md`. */
  size?: BadgeSize;
  /** An icon before the words, such as a Lucide icon. Decorative: screen readers read only the words. */
  icon?: ReactNode;
  /** Applied to the `<span>`, for layout such as margin. */
  className?: string;
  /** Reaches the `<span>`. */
  ref?: Ref<HTMLSpanElement>;
};

/**
 * A small label that says something about the item next to it: a status ("Offer", "Rejected"), a kind ("Remote"),
 * or a count in words ("3 new"). It's plain text in a pill: screen readers read its words like any other text, and
 * nothing about it can be pressed or focused. Color never carries its meaning alone: the words do.
 */
export function Badge({ tone = "neutral", size = "md", icon, children, className, ref, ...rest }: BadgeProps) {
  return (
    <span {...rest} ref={ref} className={cx("badge", className)} data-tone={tone} data-size={size}>
      {icon ? (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="badge__label">{children}</span>
    </span>
  );
}
