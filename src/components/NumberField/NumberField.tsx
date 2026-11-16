import { Field } from "@base-ui/react/field";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { useLayoutEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { FieldError } from "@/internal/FieldError";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";
import { warn, warnIfUnnamed } from "@/internal/warn";

export type NumberFieldSize = "md" | "lg";

/** A number field needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the field for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the field for screen readers when there's no visible label, such as a quantity in a table row. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Height and type size. Both meet target-min: 40px or 48px with a mouse, 44px or 52px on touch. Default: `md`. */
  size?: NumberFieldSize;
  /** The number in the field, or `null` for an empty field. Use with `onValueChange` to control it. */
  value?: number | null;
  /** The number the field starts with, when you don't control it. */
  defaultValue?: number;
  /**
   * Called with the new number, or `null` when the field is emptied: on every keystroke that reads as a number,
   * on each step, and when the text is formatted on leaving the field.
   */
  onValueChange?: (value: number | null, eventDetails: BaseNumberField.Root.ChangeEventDetails) => void;
  /** Called once a change is finished: on leaving the field after typing, on releasing a stepper, and on each arrow key. */
  onValueCommitted?: (value: number | null, eventDetails: BaseNumberField.Root.CommitEventDetails) => void;
  /** The lowest number the steppers and arrow keys reach. A lower number can still be typed: check it and show an error. */
  min?: number;
  /** The highest number the steppers and arrow keys reach. A higher number can still be typed: check it and show an error. */
  max?: number;
  /**
   * How far a stepper press or an arrow key moves the value, such as 1 for a count or 1000 for a salary. It never limits
   * what can be typed. Default: `1`.
   */
  step?: number;
  /** How far Alt with an arrow key moves the value. Default: `step`. */
  smallStep?: number;
  /** How far Shift with an arrow key moves the value. Default: ten times `step`. */
  largeStep?: number;
  /** Rounds the value to the nearest multiple of the step when it's stepped. Default: `false`. */
  snapOnStep?: boolean;
  /**
   * How the number is shown when you leave the field: currency, percent, a unit, grouping, or fraction digits, as
   * `Intl.NumberFormat` options. Separators and symbols are read as they're typed.
   */
  format?: Intl.NumberFormatOptions;
  /**
   * The locale used to read and format numbers. Default: the browser's. Set it when the page is rendered on the server,
   * so the server and the browser format the number alike.
   */
  locale?: Intl.LocalesArgument;
  /**
   * Shows the decrease and increase buttons at the end of the field. Set `false` for amounts where a step makes no
   * sense. A read-only field never shows them. Default: `true`.
   */
  steppers?: boolean;
  /** Help text between the label and the field, read before typing, such as the range. Linked to the input for screen readers. */
  description?: ReactNode;
  /** The message shown between the description and the field when `invalid` is true, with an icon. Linked to the input. */
  error?: ReactNode;
  /** Marks the field as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks typing and stepping and removes the field from the tab order. A disabled field isn't submitted. */
  disabled?: boolean;
  /** Keeps the field focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the label, and no steppers. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that the field must be filled in. Say so in the label too, in words. */
  required?: boolean;
  /** Identifies the field when the form is submitted. The form gets the plain number ("85000"), not the formatted text. */
  name?: string;
  /** The id of the input. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the field sits outside that form. */
  form?: string;
  /** What the browser may fill in, such as `transaction-amount`. Default: `off`. */
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  /** Example text shown while the field is empty. Never a substitute for the label, and never the unit: use `format`. */
  placeholder?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the visible `<input>` element, for focusing or selecting its text. */
  ref?: Ref<HTMLInputElement>;
}

export type NumberFieldProps = Labelled &
  OwnProps &
  Omit<
    BaseNumberField.Input.Props,
    | "className"
    | "render"
    | "children"
    | "aria-label"
    | "type"
    | "inputMode"
    | "pattern"
    | "maxLength"
    | "minLength"
    | "list"
    | "multiple"
    | "size"
    | keyof OwnProps
  >;

/**
 * Props left out of the type that would silently do the wrong thing if passed anyway from JavaScript, so they're
 * dropped: the input's type and keyboard are Base UI's, `pattern` and the lengths would check the formatted text,
 * and the Base UI props this component decides itself (the wheel is always off, typed values are always kept, and
 * the hidden input's ref is its own).
 */
const dropped = [
  "type",
  "inputMode",
  "pattern",
  "maxLength",
  "minLength",
  "list",
  "multiple",
  "render",
  "children",
  "allowWheelScrub",
  "allowOutOfRange",
  "inputRef",
] as const;

function withoutDropped<T extends object>(props: T): T {
  const kept = { ...props } as Record<string, unknown>;
  for (const name of dropped) delete kept[name];
  return kept as T;
}

/** A minus sign, drawn as Lucide's minus. Its line width comes from the CSS. */
function MinusIcon() {
  return (
    <svg
      className="number-field__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

/** A plus sign, drawn as Lucide's plus. Its line width comes from the CSS. */
function PlusIcon() {
  return (
    <svg
      className="number-field__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

/**
 * A text field for amounts and quantities, such as a salary, a count, or a percentage. Its value is a number, or
 * `null` when empty. It reads numbers typed with separators and symbols, formats them when you leave the field, steps
 * them with the arrow keys and with two buttons at the end of the field, and submits the plain number with the form.
 * A number typed outside `min` and `max` is kept, so the page can show an error. Built on Base UI's NumberField and
 * Field. Not for codes and IDs made of digits (postcodes, phone, card, or account numbers): use Input for those.
 */
export function NumberField(props: NumberFieldProps) {
  const {
    label,
    description,
    error,
    invalid,
    className,
    size = "md",
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    min,
    max,
    step = 1,
    smallStep = step,
    largeStep = step * 10, // Base UI rounds the stepped value, so 0.07 steps by exactly 0.7
    snapOnStep,
    format,
    locale,
    steppers = true,
    disabled,
    readOnly,
    required,
    name,
    id,
    form,
    ref,
    ...rest
  } = withoutDropped(props);
  warnIfUnnamed("NumberField", label, rest, "Give it a label or an aria-label.");
  if (min !== undefined && max !== undefined && min > max) {
    warn("NumberField", `min (${min}) is greater than max (${max}), so no value can be within both. Swap them.`);
  }

  // `step` is only how far a press moves, never a limit on what can be typed. Base UI copies it onto the hidden input
  // the form submits, where the browser would reject 85,500 in a field with a step of 1000. So after every render
  // (React writes the attribute again whenever `step` changes), set it back to "any".
  const hiddenRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    hiddenRef.current?.setAttribute("step", "any");
  });

  const showSteppers = steppers && !readOnly;
  return (
    <Field.Root
      className={cx("text-field", "number-field", className)}
      data-size={size}
      name={name}
      disabled={disabled}
      invalid={invalid}
    >
      {label !== undefined && (
        <Field.Label className="field-label number-field__label">
          {label}
          {readOnly && !disabled && <ReadOnlyNote />}
        </Field.Label>
      )}
      {description && (
        <Field.Description className="field-description number-field__description">{description}</Field.Description>
      )}
      {error && (
        <FieldError className="number-field__error" match={invalid}>
          {error}
        </FieldError>
      )}
      <BaseNumberField.Root
        className="number-field__root"
        id={id}
        name={name}
        form={form}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
        min={min}
        max={max}
        step={step}
        smallStep={smallStep}
        largeStep={largeStep}
        snapOnStep={snapOnStep}
        format={format}
        locale={locale}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        allowOutOfRange
        allowWheelScrub={false}
        inputRef={hiddenRef}
      >
        <BaseNumberField.Group className="number-field__box" data-steppers={showSteppers ? true : undefined}>
          <BaseNumberField.Input
            {...rest}
            ref={ref}
            form={form}
            className="text-field__control number-field__control"
          />
          {showSteppers && (
            <>
              <BaseNumberField.Decrement className="number-field__step">
                <MinusIcon />
              </BaseNumberField.Decrement>
              <BaseNumberField.Increment className="number-field__step">
                <PlusIcon />
              </BaseNumberField.Increment>
            </>
          )}
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    </Field.Root>
  );
}
