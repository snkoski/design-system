import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { FieldError } from "@/internal/FieldError";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";
import { warnIfUnnamed } from "@/internal/warn";

export type SegmentedControlSize = "md" | "lg";

/** A segmented control needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the options, naming the question they answer. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the control for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the options, naming the question they answer. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the control for screen readers when there's no visible label. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Height and type size, matching Input and Button so they line up in a form. Default: `md`. */
  size?: SegmentedControlSize;
  /** The value of the chosen option, or `null` for none. Use with `onValueChange` to control it. */
  value?: string | null;
  /** The value of the option that starts chosen, when you don't control it. Usually set, so one option is always chosen. */
  defaultValue?: string;
  /** Called when a different option is chosen, with its value. */
  onValueChange?: (value: string, eventDetails: BaseRadioGroup.ChangeEventDetails) => void;
  /** Identifies the field when the form is submitted. The chosen option submits its `value` under this name. */
  name?: string;
  /**
   * Tells assistive technology and the form that a choice must be made. Say so in the label too, in words.
   * It only matters when nothing starts chosen. The browser then blocks the form from submitting until an option
   * is chosen. To show your own error instead, give the form `noValidate`, and set `invalid` and `error`.
   */
  required?: boolean;
  /** Help text between the label and the options, read before choosing. Linked to the control and to each option. */
  description?: ReactNode;
  /** The message shown between the description and the options when `invalid` is true, with an icon. Linked to the control and to each option. */
  error?: ReactNode;
  /** Marks the control and every option as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /**
   * Blocks all interaction with every option. A disabled control isn't submitted. Its chosen option can still be
   * reached with Tab, and is announced as disabled.
   */
  disabled?: boolean;
  /** Keeps the control focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the label. The arrow keys move focus without choosing. */
  readOnly?: boolean;
  /** The id of a `<form>` to submit with, when the control sits outside that form. */
  form?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the element with the radiogroup role. */
  ref?: Ref<HTMLDivElement>;
  /**
   * The options: a `Segment` with a `value` for each. Two to about five, with short labels of a word or two: in a
   * narrow space, a word too long for its option breaks across lines.
   */
  children?: ReactNode;
}

export type SegmentedControlProps = Labelled &
  OwnProps &
  Omit<BaseRadioGroup.Props<string>, "className" | "render" | "aria-label" | "inputRef" | keyof OwnProps>;

/**
 * A row of connected buttons where one option at a time is chosen, such as "Monthly / Yearly" or "List / Grid", made of
 * `Segment`s. For two to about five short options that should all be visible at once. Built on Base UI's RadioGroup,
 * Fieldset, and Field, so screen readers announce it as a radio group, the label, description, and error are linked
 * to it, and it takes part in forms. It's one Tab stop, and the arrow keys move between options and choose them.
 * For longer options or ones that need descriptions, use a RadioGroup; for options that can be combined, a
 * CheckboxGroup.
 */
export function SegmentedControl({
  label,
  description,
  error,
  invalid,
  disabled,
  name,
  size = "md",
  onValueChange,
  className,
  ref,
  children,
  ...rest
}: SegmentedControlProps) {
  warnIfUnnamed("SegmentedControl", label, rest, "Give it a label or an aria-label.");

  return (
    <Field.Root className={cx("choice-group", "segmented-control", className)} data-size={size} name={name} disabled={disabled} invalid={invalid}>
      <Fieldset.Root className="choice-group__group segmented-control__group" render={
          // null is how a controlled control says nothing is chosen; a person's choice is never null
          <BaseRadioGroup<string | null>
            {...rest}
            ref={ref}
            onValueChange={(value, eventDetails) => value !== null && onValueChange?.(value, eventDetails)}
          />
        }>
        {label !== undefined && (
          <Fieldset.Legend className="field-label segmented-control__label">
            {label}
            {rest.readOnly && !disabled && <ReadOnlyNote />}
          </Fieldset.Legend>
        )}
        {description && <Field.Description className="field-description segmented-control__description">{description}</Field.Description>}
        {error && (
          <FieldError className="segmented-control__error" match={invalid}>
            {error}
          </FieldError>
        )}
        <div className="segmented-control__track">{children}</div>
      </Fieldset.Root>
    </Field.Root>
  );
}
