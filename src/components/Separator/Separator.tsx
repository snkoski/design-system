import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/internal/cx";
import { hasContent } from "@/internal/warn";

export type SeparatorOrientation = "horizontal" | "vertical";

type SharedProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "role" | "aria-orientation" | "aria-hidden" | "className"
> & {
  /** Applied to the separator, for layout such as margin or a width. */
  className?: string;
  /** Reaches the separator: an `<hr>`, or a `<div>` when it has a label. */
  ref?: Ref<HTMLElement>;
};

export type SeparatorProps = SharedProps &
  (
    | {
        /** Which way the line runs. Default: `horizontal`. */
        orientation?: "horizontal";
        /**
         * Words in the middle of the line, such as "or" between two ways to sign in. Hidden from screen readers,
         * which hear only "separator", so use words that repeat what the page already makes clear. A section's
         * name belongs in a heading instead.
         */
        label?: string;
      }
    | {
        /**
         * Which way the line runs. A vertical line is as tall as its row, so it needs a flex or grid parent.
         * Default: `horizontal`.
         */
        orientation: "vertical";
        /** A vertical separator can't have a label. */
        label?: never;
      }
  );

/**
 * A line between groups of content: across the page, or between items in a row. Screen readers announce it as
 * "separator". It adds no space of its own, so the layout's `gap` or margin sets the space around it. Put it between
 * lists, not inside one. A list's rows and a card's edges get their lines from List, Card, and Table.
 *
 * Without a label it's an `<hr>`, so it still shows as a line on a page with no CSS. An `<hr>` can't hold text, so
 * with a label it's a `<div role="separator">`, with the line drawn on either side of the words.
 */
export function Separator({ orientation = "horizontal", label, className, ref, ...rest }: SeparatorProps) {
  // TypeScript doesn't stop hyphenated attributes it doesn't know, and these would override Base UI's own, so a
  // line drawn one way could be announced another, or not at all. They're dropped.
  const {
    role: _role,
    "aria-orientation": _orientation,
    "aria-hidden": _hidden,
    ...attributes
  } = rest as HTMLAttributes<HTMLElement>;
  // The types allow a label only when horizontal; untyped code that passes one to a vertical line gets the plain line
  const labelled = orientation === "horizontal" && hasContent(label);
  return (
    // Base UI's props are typed for a <div>; the element is an <hr> or a <div>, and both take every prop here
    <BaseSeparator
      {...(attributes as HTMLAttributes<HTMLDivElement>)}
      ref={ref as Ref<HTMLDivElement>}
      className={cx("separator", className)}
      orientation={orientation}
      render={labelled ? undefined : <hr />}
    >
      {labelled ? (
        <span className="separator__label" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </BaseSeparator>
  );
}
