import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cx } from "../../internal/cx";
import { SpinnerGraphic } from "../../internal/SpinnerGraphic";
import { useLoadingAnnouncement } from "../../internal/useLoadingAnnouncement";
import { hasContent, warn } from "../../internal/warn";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "role" | "aria-live" | "aria-atomic" | "aria-label" | "aria-labelledby" | "aria-hidden" | "className"
> & {
  /**
   * What's loading, as plain text that ends with an ellipsis: "Loading applications…", not "Please wait". Shown
   * beside the spinner and announced once to screen readers. Required: a spinner that doesn't say what it's
   * waiting for tells nobody anything.
   */
  label: string;
  /**
   * Hides the label from view, where there's no room for it. Screen readers still announce it. Default: `false`.
   */
  hideLabel?: boolean;
  /** The drawing's size: 16, 20, or 24px. The label is small text at `sm` and body text otherwise. Default: `md`. */
  size?: SpinnerSize;
  /**
   * Milliseconds to wait before showing and announcing the spinner, so a load that finishes quickly never flashes
   * it. Read once, when the spinner appears: changing it later does nothing. Default: `0`.
   */
  delay?: number;
  /** Applied to the outer `<span>`, for layout such as centering or padding. */
  className?: string;
  /** Reaches the outer `<span>`. */
  ref?: Ref<HTMLSpanElement>;
};

/**
 * Shows that a page or section is loading, with words that say what's loading. For a button's own action, use
 * Button's `loading` instead.
 *
 * The label is rendered twice. The one you see is in the HTML from the start, so it shows (and is read) even before
 * JavaScript runs, or without it. The other is a visually hidden `role="status"` region, which starts empty and
 * gets the same words a moment later, because screen readers announce a live region when its text changes, not
 * when it arrives with its text already inside. Once JavaScript runs, the visible label is hidden from screen
 * readers, so the words are read once.
 */
export function Spinner({
  label,
  hideLabel = false,
  size = "md",
  delay = 0,
  className,
  style,
  ref,
  ...rest
}: SpinnerProps) {
  if (!hasContent(label)) {
    warn("Spinner", 'has an empty label, so it doesn\'t say what\'s loading and screen readers announce nothing. Give it a label such as "Loading projects…".');
  }
  // The delay, read once, and the phase: "server" (the HTML before JavaScript), "waiting", then "announced"
  const { wait, phase } = useLoadingAnnouncement(delay);

  return (
    <span
      {...rest}
      ref={ref}
      className={cx("spinner", className)}
      data-size={size}
      data-delayed={wait > 0 || undefined}
      style={wait > 0 ? ({ ...style, "--spinner-delay": `${wait}ms` } as CSSProperties) : style}
    >
      <SpinnerGraphic className="spinner__graphic" />
      <span className={cx("spinner__label", hideLabel && "visually-hidden")} aria-hidden={phase !== "server" || undefined}>
        {label}
      </span>
      <span className="visually-hidden spinner__status" role="status">
        {phase === "announced" ? label : null}
      </span>
    </span>
  );
}
