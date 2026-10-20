import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { warnIfUnnamed } from "../../internal/warn";

/** A group needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the options, naming the question they answer. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the group for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the options, naming the question they answer. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the group for screen readers when there's no visible label. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** The value of the selected radio, or `null` for none. Use with `onValueChange` to control the group. */
  value?: string | null;
  /** The value of the radio that starts selected, when you don't control the group. Without it, none is. */
  defaultValue?: string;
  /** Called when a different radio is selected, with its value. */
  onValueChange?: (value: string, eventDetails: BaseRadioGroup.ChangeEventDetails) => void;
  /** Identifies the field when the form is submitted. The selected radio submits its `value` under this name. */
  name?: string;
  /**
   * Tells assistive technology and the form that a choice must be made. Say so in the label too, in words.
   * The browser then blocks the form from submitting until a radio is selected. To show your own error instead,
   * give the form `noValidate`, and set `invalid` and `error` when nothing is selected.
   */
  required?: boolean;
  /** Help text between the label and the options, read before choosing. Linked to the group and to each radio. */
  description?: ReactNode;
  /** The message shown under the options when `invalid` is true, with an icon. Linked to the group and to each radio. */
  error?: ReactNode;
  /** Marks the group and every radio as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  // Tab reaching a disabled group is Base UI's behavior, kept for now: see docs/revisit.md
  /**
   * Blocks all interaction with every radio. A disabled group isn't submitted. Its selected radio can still be
   * reached with Tab, and is announced as disabled.
   */
  disabled?: boolean;
  /** Keeps the group focusable, readable, and submitted, but blocks changes. The arrow keys move focus without selecting. */
  readOnly?: boolean;
  /** The id of a `<form>` to submit with, when the group sits outside that form. */
  form?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the element with the radiogroup role. */
  ref?: Ref<HTMLDivElement>;
  /** The options: a `Radio` with a `value` for each. */
  children?: ReactNode;
}

export type RadioGroupProps = Labelled &
  OwnProps &
  Omit<BaseRadioGroup.Props<string>, "className" | "render" | "aria-label" | "inputRef" | keyof OwnProps>;

/**
 * A labelled set of options where exactly one can be chosen, made of `Radio`s. Built on Base UI's RadioGroup,
 * Fieldset, and Field, so the label, description, and error are linked to the group and its radios for screen
 * readers. The group is one Tab stop, and the arrow keys move between radios and select them. For options that
 * can be combined, use a CheckboxGroup; for a long list, a select.
 */
export function RadioGroup({
  label,
  description,
  error,
  invalid,
  disabled,
  name,
  onValueChange,
  className,
  ref,
  children,
  ...rest
}: RadioGroupProps) {
  warnIfUnnamed("RadioGroup", label, rest, "Give it a label or an aria-label.");

  return (
    <Field.Root className={cx("radio-group", className)} name={name} disabled={disabled} invalid={invalid}>
      <Fieldset.Root className="radio-group__group" render={
          // null is how a controlled group says nothing is selected; a person's choice is never null
          <BaseRadioGroup<string | null>
            {...rest}
            ref={ref}
            onValueChange={(value, eventDetails) => value !== null && onValueChange?.(value, eventDetails)}
          />
        }>
        {label !== undefined && <Fieldset.Legend className="radio-group__label">{label}</Fieldset.Legend>}
        {description && <Field.Description className="radio-group__description">{description}</Field.Description>}
        <div className="radio-group__options">{children}</div>
        {error && (
          <FieldError className="radio-group__error" match={invalid}>
            {error}
          </FieldError>
        )}
      </Fieldset.Root>
    </Field.Root>
  );
}
