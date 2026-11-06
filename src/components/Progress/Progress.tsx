import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { useId } from "react";
import { barPercent, percentText } from "../../internal/bar";
import { cx } from "../../internal/cx";
import { useLoadingAnnouncement } from "../../internal/useLoadingAnnouncement";
import { hasContent, warn } from "../../internal/warn";

export type ProgressSize = "sm" | "md";

export type ProgressProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "children"
  | "role"
  | "className"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-valuetext"
  | "aria-valuenow"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-hidden"
  | "aria-live"
  | "aria-busy"
> & {
  /**
   * What's under way, as plain text that ends with an ellipsis: "Uploading resume.pdf…", "Importing contacts…".
   * Shown above the bar, names it for screen readers, and is announced once when it appears. Change it when the
   * task finishes ("Uploaded resume.pdf", with no ellipsis), and the new words are announced too.
   */
  label: string;
  /**
   * How far along the task is, between `min` and `max`, or `null` when it doesn't know yet: then a short fill
   * slides across until it does. A value outside the range is shown at the nearest end.
   */
  value: number | null;
  /** The value at the start: an empty bar. Default: `0`. */
  min?: number;
  /** The value when it's done: a full bar. Default: `100`. */
  max?: number;
  /**
   * How far along it is in words, shown beside the label and read to screen readers: "3 of 10 files". Without it,
   * the value is a percent of the range in English ("30%"), or nothing while `value` is `null`; a page in another
   * language passes its own words.
   */
  valueText?: string;
  /** A sentence under the bar, such as how long is left. Screen readers read it as the bar's description. */
  description?: string;
  /** The bar's thickness: `sm` (4px) or `md` (8px). The text stays the same size. Default: `md`. */
  size?: ProgressSize;
  /**
   * Hides the label and value from view, where there's no room, such as along the top edge of a card. Screen
   * readers still hear both. Default: `false`.
   */
  hideLabel?: boolean;
  /**
   * Milliseconds to wait before showing and announcing the bar, so a task that finishes quickly never flashes it.
   * Read once, when the bar appears: changing it later does nothing. During the delay the bar is invisible but still
   * there, so a screen reader moving through the page can find it. Default: `0`.
   */
  delay?: number;
  /** Applied to the outer `<div>`, for layout such as width. In a flex row it shrinks to the width of its label and value: add `flex-1` or a width. */
  className?: string;
  /** Reaches the outer `<div>`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Shows a task that's under way and will finish, such as an upload or an import: a bar that fills as it goes, or a
 * short fill that slides across while it doesn't know how long it will take. For an amount that isn't a task, such
 * as storage used, use Meter. For a short wait you can't measure, use Spinner or Skeleton.
 *
 * Screen readers hear the label as the bar's name and the value as its value, from the first HTML the server
 * sends. The label is also announced once, through a visually hidden status region beside the bar, the way
 * Spinner announces itself; changes to the value aren't announced.
 */
export function Progress({
  label,
  value,
  min = 0,
  max = 100,
  valueText,
  description,
  size = "md",
  hideLabel = false,
  delay = 0,
  className,
  style,
  ref,
  ...rest
}: ProgressProps) {
  if (!hasContent(label)) {
    warn(
      "Progress",
      'has an empty label, so it doesn\'t say what\'s under way and screen readers announce nothing. Give it a label such as "Uploading resume.pdf…".',
    );
  }
  // The delay, read once, and the phase: "server" (the HTML before JavaScript), "waiting", then "announced"
  const { wait, phase } = useLoadingAnnouncement(delay);
  // Our own ids, so the links to the label and description are in the server's HTML: Base UI links the label only
  // once JavaScript runs
  const id = useId();
  const labelId = `${id}label`;
  const descriptionId = `${id}description`;
  // Base UI treats anything but a finite number as "doesn't know how long"
  const known = value !== null && Number.isFinite(value);
  const percent = known ? barPercent(value, min, max) : 0;
  const text = valueText || (known ? percentText(percent) : undefined);

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("bar progress", className)}
      data-size={size}
      data-delayed={wait > 0 || undefined}
      style={wait > 0 ? ({ ...style, "--progress-delay": `${wait}ms` } as CSSProperties) : style}
    >
      <BaseProgress.Root
        className="bar__bar progress__bar"
        value={known ? value : null}
        min={min}
        max={max}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        // With no words, none at all, rather than Base UI's English "indeterminate progress": the label says what's happening
        aria-valuetext={text}
      >
        <BaseProgress.Label id={labelId} className={cx("bar__label progress__label", hideLabel && "visually-hidden")}>
          {label}
        </BaseProgress.Label>
        {text && (
          <BaseProgress.Value className={cx("bar__value progress__value", hideLabel && "visually-hidden")}>{() => text}</BaseProgress.Value>
        )}
        <BaseProgress.Track className="bar__track progress__track">
          {/* Full width, placed by --bar-value in bar.css, instead of Base UI's width. While it doesn't know how
              long, progress.css slides it instead. */}
          <BaseProgress.Indicator
            className="bar__fill progress__fill"
            style={known ? ({ width: "100%", "--bar-value": percent } as CSSProperties) : undefined}
          />
        </BaseProgress.Track>
      </BaseProgress.Root>
      {/* Beside the bar, not inside it: a progress bar's children are presentational, so screen readers may skip them */}
      {description && (
        <p id={descriptionId} className="bar__description progress__description">
          {description}
        </p>
      )}
      <span className="visually-hidden progress__status" role="status">
        {phase === "announced" ? label : null}
      </span>
    </div>
  );
}
