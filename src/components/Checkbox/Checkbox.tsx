import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import type { ReactNode, Ref } from "react";

/** A checkbox needs a name a screen reader can announce: visible label text, or an `aria-label`. */
type Labelled =
  | { children: Exclude<ReactNode, undefined | null | boolean>; "aria-label"?: string }
  | { children?: undefined; "aria-label": string };

interface OwnProps {
  /** Whether the checkbox is ticked. Use with `onCheckedChange` to control it. */
  checked?: boolean;
  /** Whether the checkbox starts ticked, when you don't control it. Default: `false`. */
  defaultChecked?: boolean;
  /** Called when the checkbox is ticked or unticked, with the new value. */
  onCheckedChange?: (checked: boolean, eventDetails: BaseCheckbox.Root.ChangeEventDetails) => void;
  /**
   * Shows a dash instead of a tick: some, but not all, of a group's boxes are ticked.
   * Controlled by you. Clicking still calls `onCheckedChange`, and you decide what the next state is.
   */
  indeterminate?: boolean;
  /** Blocks all interaction and removes the checkbox from the tab order. */
  disabled?: boolean;
  /** Keeps the checkbox focusable and readable, but blocks changes. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that this box must be ticked. Say so in the label too, in words. */
  required?: boolean;
  /** Marks the checkbox as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Identifies the field when the form is submitted. */
  name?: string;
  /**
   * The id of the hidden `<input>`, not of the visible checkbox. A `<label htmlFor>` pointing at it
   * toggles the checkbox but doesn't give it a name screen readers announce, so label it with
   * `children` or `aria-label` instead.
   */
  id?: string;
  /** The id of a `<form>` to submit with, when the checkbox sits outside that form. */
  form?: string;
  /** What a ticked checkbox submits with the form. Without it, the browser's default `on` is submitted. */
  value?: string;
  /** What the checkbox submits when it's unticked. Without it, an unticked checkbox submits nothing, like a native one. */
  uncheckedValue?: string;
  /** Secondary text under the label. Linked to the checkbox so screen readers read it too. */
  description?: ReactNode;
  /** The message shown when `invalid` is true, with an icon. Linked to the checkbox. */
  error?: ReactNode;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the focusable checkbox element. */
  ref?: Ref<HTMLElement>;
  /** Reaches the hidden `<input>` that takes part in the form. */
  inputRef?: Ref<HTMLInputElement>;
}

export type CheckboxProps = Labelled &
  OwnProps &
  Omit<BaseCheckbox.Root.Props, "className" | "render" | "nativeButton" | "children" | "aria-label" | keyof OwnProps>;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function Mark({ indeterminate }: { indeterminate: boolean }) {
  return (
    <svg
      className="checkbox__mark"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {indeterminate ? <path d="M3.5 8h9" /> : <path d="m3 8.5 3.5 3.5L13 4.5" />}
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="checkbox__error-icon"
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
 * A box that is ticked or unticked, with its label. Built on Base UI's Checkbox and Field, so the
 * label, description, and error are linked to the checkbox for screen readers, and it takes part in forms.
 * Clicking the label text ticks the box. Use it for options that can be chosen independently;
 * for exactly one choice from a list, use a radio group.
 */
export function Checkbox({
  children,
  description,
  error,
  invalid,
  className,
  disabled,
  name,
  indeterminate = false,
  ...rest
}: CheckboxProps) {
  const box = (
    <BaseCheckbox.Root
      {...rest}
      className="checkbox__box"
      disabled={disabled}
      name={name}
      indeterminate={indeterminate}
    >
      <BaseCheckbox.Indicator className="checkbox__indicator">
        <Mark indeterminate={indeterminate} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );

  return (
    <Field.Root className={cx("checkbox", className)} name={name} disabled={disabled} invalid={invalid}>
      {children === undefined ? (
        box
      ) : (
        <Field.Label className="checkbox__row">
          {box}
          <span className="checkbox__label">{children}</span>
        </Field.Label>
      )}
      {description && <Field.Description className="checkbox__description">{description}</Field.Description>}
      {error && (
        <Field.Error className="checkbox__error" match={invalid}>
          <ErrorIcon />
          <span>{error}</span>
        </Field.Error>
      )}
    </Field.Root>
  );
}
