import { Field } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cx } from "./cx";

/** A warning triangle with an exclamation mark, drawn as Lucide's triangle-alert. Its line width comes from the CSS. */
function ErrorIcon() {
  return (
    <svg
      className="field-error__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * The error message every form control shows when it's invalid: an icon and words, so the problem is never
 * only a color. Built on Base UI's Field.Error, so it's linked to the field's control for screen readers.
 * The message starts with a visually hidden "Error:", so a screen reader, which hears the field's description and
 * error one after the other, can tell where the problem starts. Each control renders it between its label (and
 * description) and the control itself. Place it inside a Field.Root. Internal: not exported from the package.
 */
export function FieldError({
  className,
  match,
  children,
}: {
  /** The component's own class for this part, such as `checkbox__error`, added next to `field-error`. */
  className?: string;
  /** Shows the message when true. Pass the control's `invalid` prop. */
  match: boolean | undefined;
  /** The message. */
  children: ReactNode;
}) {
  return (
    <Field.Error className={cx("field-error", className)} match={match}>
      <ErrorIcon />
      {/* The space between them is its own text node: a space inside the prefix is trimmed when screen readers
          join the parts, which would read "Error:Enter". Between flex items it takes no room on screen. */}
      <span className="field-error__prefix">Error:</span> <span>{children}</span>
    </Field.Error>
  );
}
