import { cx } from "./cx";

/**
 * The spinning drawing Spinner and a loading Button share: a faint full circle as the track, and a quarter of a
 * circle on top that `spinner-graphic.css` turns. Both are drawn in `currentColor`, so it takes the text color around
 * it. Hidden from screen readers: Spinner announces itself with words, and a loading Button with `aria-busy`. Its
 * size comes from the parent. Internal: not exported from the package.
 */
export function SpinnerGraphic({
  className,
}: {
  /** The component's own class for this part, such as `button__spinner`, added next to `spinner-graphic`. */
  className?: string;
}) {
  return (
    <svg className={cx("spinner-graphic", className)} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
