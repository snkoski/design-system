import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url";
export type InputSize = "md" | "lg";

/** An input needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | { label: Exclude<ReactNode, undefined | null | boolean>; "aria-label"?: string }
  | { label?: undefined; "aria-label": string };

interface OwnProps {
  /** The kind of text it takes. Text-like types only; use a number field for numbers. Default: `text`. */
  type?: InputType;
  /** Height and type size. Both meet the 44px target. Default: `md`. */
  size?: InputSize;
  /** The text in the field. Use with `onValueChange` to control it. */
  value?: string;
  /** The text the field starts with, when you don't control it. */
  defaultValue?: string;
  /** Called on every change with the new text. */
  onValueChange?: (value: string, eventDetails: BaseInput.ChangeEventDetails) => void;
  /** Icon at the start of the field, such as a magnifier for search. Decorative: hidden from screen readers. */
  iconStart?: ReactNode;
  /** Icon at the end of the field. Decorative: hidden from screen readers. */
  iconEnd?: ReactNode;
  /** Help text between the label and the field, read before typing. Linked to the input for screen readers. */
  description?: ReactNode;
  /** The message shown under the field when `invalid` is true, with an icon. Linked to the input. */
  error?: ReactNode;
  /** Marks the input as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks typing and removes the input from the tab order. A disabled input isn't submitted. */
  disabled?: boolean;
  /** Keeps the input focusable, readable, and submitted, but blocks changes. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that the field must be filled in. Say so in the label too, in words. */
  required?: boolean;
  /** Identifies the field when the form is submitted. */
  name?: string;
  /** The id of the input. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the input sits outside that form. */
  form?: string;
  /**
   * What the browser may fill in, such as `name`, `email`, or `new-password`. Set it on fields that ask
   * about the person, so autofill and assistive tools can help (WCAG 1.3.5).
   */
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  /** Which on-screen keyboard to show, such as `email`, `tel`, or `numeric`, without changing validation. */
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Example text shown while the field is empty. Never a substitute for the label: it disappears as you type. */
  placeholder?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the `<input>` element, for focusing or selecting its text. */
  ref?: Ref<HTMLInputElement>;
}

export type InputProps = Labelled &
  OwnProps &
  Omit<BaseInput.Props, "className" | "render" | "children" | "aria-label" | keyof OwnProps>;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function ErrorIcon() {
  return (
    <svg
      className="input__error-icon"
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
 * A single-line text field with its label, an optional description, and an error. Built on Base UI's
 * Input and Field, so the label, description, and error are linked to the input for screen readers,
 * and it takes part in forms. For numbers, longer text, or picking from options, use a number field,
 * a textarea, or a select instead.
 */
export function Input({
  label,
  description,
  error,
  invalid,
  className,
  disabled,
  name,
  type = "text",
  size = "md",
  iconStart,
  iconEnd,
  ref,
  ...rest
}: InputProps) {
  return (
    <Field.Root className={cx("input", className)} data-size={size} name={name} disabled={disabled} invalid={invalid}>
      {label !== undefined && <Field.Label className="input__label">{label}</Field.Label>}
      {description && <Field.Description className="input__description">{description}</Field.Description>}
      <div
        className="input__box"
        data-icon-start={iconStart ? true : undefined}
        data-icon-end={iconEnd ? true : undefined}
      >
        {iconStart && <span className="input__icon" aria-hidden="true">{iconStart}</span>}
        <BaseInput {...rest} ref={ref} className="input__control" type={type} disabled={disabled} name={name} />
        {iconEnd && <span className="input__icon" aria-hidden="true">{iconEnd}</span>}
      </div>
      {error && (
        <Field.Error className="input__error" match={invalid}>
          <ErrorIcon />
          <span>{error}</span>
        </Field.Error>
      )}
    </Field.Root>
  );
}
