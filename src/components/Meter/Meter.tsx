import { Meter as BaseMeter } from "@base-ui/react/meter";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { useId } from "react";
import { barPercent, percentText } from "../../internal/bar";
import { cx } from "../../internal/cx";
import { hasContent, warn } from "../../internal/warn";

export type MeterTone = "neutral" | "success" | "warning" | "danger";
export type MeterSize = "sm" | "md";

export type MeterProps = Omit<
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
  /** What it measures, as plain text: "Topics done", "Storage used". Shown above the bar, and names it for screen readers. */
  label: string;
  /** The amount, between `min` and `max`. A value outside them is shown at the nearest end. */
  value: number;
  /** The lowest value: an empty bar. Default: `0`. */
  min?: number;
  /** The highest value: a full bar. Default: `100`. */
  max?: number;
  /**
   * The value in words, shown beside the label and read to screen readers: "12 of 20", "4.6 of 5 GB". Without it,
   * the value is a percent of the range in English ("60%"); a page in another language passes its own words.
   */
  valueText?: string;
  /** A sentence under the bar, such as what the amount means or what to do about it. Screen readers read it as the meter's description. */
  description?: string;
  /**
   * The fill's color, for a status: `success`, `warning`, or `danger`. Color never says it alone: put the status in
   * words too, in `valueText` or `description` ("Almost full. Delete old files to make room."). Default: `neutral`.
   */
  tone?: MeterTone;
  /** The bar's thickness: `sm` (4px) or `md` (8px). The text stays the same size. Default: `md`. */
  size?: MeterSize;
  /** Applied to the outer `<div>`, for layout such as width. In a flex row it shrinks to the width of its label and value: add `flex-1` or a width. */
  className?: string;
  /** Reaches the outer `<div>`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Shows how much of something there is, out of a known amount: "Topics done, 12 of 20", "Storage used, 4.6 of 5 GB".
 * A reading, not a task: for something under way, such as an upload, use Progress.
 *
 * The words say the amount, and the bar shows it at a glance. Screen readers hear the label as the meter's name and
 * the words as its value, from the first HTML the server sends.
 */
export function Meter({
  label,
  value,
  min = 0,
  max = 100,
  valueText,
  description,
  tone = "neutral",
  size = "md",
  className,
  ref,
  ...rest
}: MeterProps) {
  if (!hasContent(label)) {
    warn("Meter", 'has an empty label, so screen readers can\'t tell what it measures. Give it a label such as "Topics done".');
  }
  // Our own ids, so the links to the label and description are in the server's HTML: Base UI links the label only
  // once JavaScript runs
  const id = useId();
  const labelId = `${id}label`;
  const descriptionId = `${id}description`;
  const percent = barPercent(value, min, max);
  const text = valueText || percentText(percent);

  return (
    <div {...rest} ref={ref} className={cx("bar meter", className)} data-tone={tone} data-size={size}>
      <BaseMeter.Root
        className="bar__bar meter__bar"
        value={value}
        min={min}
        max={max}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        aria-valuetext={text}
      >
        <BaseMeter.Label id={labelId} className="bar__label meter__label">
          {label}
        </BaseMeter.Label>
        <BaseMeter.Value className="bar__value meter__value">{() => text}</BaseMeter.Value>
        <BaseMeter.Track className="bar__track meter__track">
          {/* Full width, placed by --bar-value in bar.css, instead of Base UI's width */}
          <BaseMeter.Indicator className="bar__fill meter__fill" style={{ width: "100%", "--bar-value": percent } as CSSProperties} />
        </BaseMeter.Track>
      </BaseMeter.Root>
      {/* Beside the meter, not inside it: a meter's children are presentational, so screen readers may skip them */}
      {description && (
        <p id={descriptionId} className="bar__description meter__description">
          {description}
        </p>
      )}
    </div>
  );
}
