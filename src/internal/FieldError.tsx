import { Field } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cx } from "./cx";

function ErrorIcon() {
  return (
    <svg
      className="field-error__icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75V8.5M8 11h.01" />
    </svg>
  );
}

/**
 * The error message every form control shows when it's invalid: an icon and words, so the problem is never
 * only a color. Built on Base UI's Field.Error, so it's linked to the field's control for screen readers.
 * Place it inside a Field.Root. Internal: not exported from the package.
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
      <span>{children}</span>
    </Field.Error>
  );
}
