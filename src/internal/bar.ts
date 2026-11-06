/**
 * What Meter and Progress share: where the fill sits, and the default words for the value. Not exported from the
 * package; the look they share is bar.css.
 */

// English, whatever the reader's or the server's language, so the server's HTML and the browser's first render
// always agree. A page in another language passes its own valueText.
const percentFormat = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

/**
 * How far `value` is from `min` to `max`, from 0 to 100. Like Base UI, so the fill matches what screen readers hear,
 * a value outside the range is clamped to its ends and a value that isn't a number counts as the minimum. An empty
 * or backwards range is a mistake with no right answer, and gives 0: an empty bar.
 */
export function barPercent(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  const clamped = Number.isNaN(value) ? min : Math.min(Math.max(value, min), max);
  return ((clamped - min) / (max - min)) * 100;
}

/**
 * A percent from 0 to 100 as words, rounded to a whole number: "60%". Only an empty bar says "0%" and only a full
 * one "100%": 99.6 says "99%", so the words never claim a storage meter is full when it isn't.
 */
export function percentText(percent: number): string {
  const whole = Math.min(Math.max(Math.round(percent), percent > 0 ? 1 : 0), percent < 100 ? 99 : 100);
  return percentFormat.format(whole / 100);
}
