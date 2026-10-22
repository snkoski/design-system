import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { warnIfUnnamed } from "../../internal/warn";

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url";
export type InputSize = "md" | "lg";

/** An input needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the input for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the input for screen readers when there's no visible label, such as a search field in a toolbar. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** The kind of text it takes. Text-like types only; use a number field for numbers. Default: `text`. */
  type?: InputType;
  /** Height and type size. Both meet target-min: 40px or 48px with a mouse, 44px or 52px on touch. Default: `md`. */
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

/**
 * A single-line text field with its label, an optional description, and an error. Built on Base UI's
 * Input and Field, so the label, description, and error are linked to the input for screen readers,
 * and it takes part in forms. For longer text, use TextArea. For numbers or picking from options, use a
 * number field or a select instead.
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
  warnIfUnnamed("Input", label, rest, "Give it a label or an aria-label.");
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
        <FieldError className="input__error" match={invalid}>
          {error}
        </FieldError>
      )}
    </Field.Root>
  );
}
