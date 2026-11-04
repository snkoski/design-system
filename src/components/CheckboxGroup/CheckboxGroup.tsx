import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { useMemo } from "react";
import type { ReactNode, Ref } from "react";
import { CheckboxGroupContext } from "./context";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { ReadOnlyNote } from "../../internal/ReadOnlyNote";
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
  /** The values of the ticked options. Use with `onValueChange` to control the group. */
  value?: string[];
  /** The values of the options that start ticked, when you don't control the group. */
  defaultValue?: string[];
  /** Called when an option is ticked or unticked, with the values of every ticked option. */
  onValueChange?: (value: string[], eventDetails: BaseCheckboxGroup.ChangeEventDetails) => void;
  /**
   * The values of every option. Needed only for a "select all" box (`<Checkbox parent>`),
   * which uses it to tick or untick them all. Without it, the parent box ticks only itself.
   */
  allValues?: string[];
  /** Identifies the field when the form is submitted. Every ticked option submits its `value` under this name. */
  name?: string;
  /** Help text between the label and the options, read before choosing. Linked to the group and to each option. */
  description?: ReactNode;
  /** The message shown between the description and the options when `invalid` is true, with an icon. Linked to the group and to each option. */
  error?: ReactNode;
  /**
   * Marks every option as failing validation. Pair it with `error` so the problem is in words, not just color.
   * There's no `required` prop: to ask for at least one choice, say "(required)" in the label, check the value,
   * and set `invalid` and `error`.
   */
  invalid?: boolean;
  /** Blocks all interaction with every option and removes them from the tab order. A disabled group isn't submitted. */
  disabled?: boolean;
  /** Keeps every option focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the group's label. */
  readOnly?: boolean;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the element with the group role. */
  ref?: Ref<HTMLDivElement>;
  /** The options: a `Checkbox` with a `value` for each, and optionally one `Checkbox parent` to select all. */
  children?: ReactNode;
}

export type CheckboxGroupProps = Labelled &
  OwnProps &
  Omit<BaseCheckboxGroup.Props, "className" | "render" | "aria-label" | keyof OwnProps>;

/**
 * A labelled set of checkboxes that make up one form field. Each option can be ticked on its own, and the
 * field's value is the list of ticked options. Built on Base UI's CheckboxGroup, Fieldset, and Field, so
 * the label, description, and error are linked to the group and its options for screen readers.
 * Put a `Checkbox` with a `value` inside for each option, and add `<Checkbox parent>` with `allValues`
 * for a "select all" box. For exactly one choice, use a RadioGroup; for a single yes or no, a Checkbox.
 */
export function CheckboxGroup({
  label,
  description,
  error,
  invalid,
  disabled,
  readOnly = false,
  name,
  className,
  ref,
  children,
  ...rest
}: CheckboxGroupProps) {
  const hasAllValues = rest.allValues !== undefined;
  const context = useMemo(() => ({ readOnly, hasAllValues }), [readOnly, hasAllValues]);
  warnIfUnnamed("CheckboxGroup", label, rest, "Give it a label or an aria-label.");

  return (
    <Field.Root className={cx("choice-group", "checkbox-group", className)} name={name} disabled={disabled} invalid={invalid}>
      <Fieldset.Root className="choice-group__group checkbox-group__group" render={<BaseCheckboxGroup {...rest} ref={ref} />}>
        {label !== undefined && (
          <Fieldset.Legend className="field-label checkbox-group__label">
            {label}
            {readOnly && !disabled && <ReadOnlyNote />}
          </Fieldset.Legend>
        )}
        {description && <Field.Description className="field-description checkbox-group__description">{description}</Field.Description>}
        {error && (
          <FieldError className="checkbox-group__error" match={invalid}>
            {error}
          </FieldError>
        )}
        <div className="choice-group__options checkbox-group__options">
          <CheckboxGroupContext.Provider value={context}>{children}</CheckboxGroupContext.Provider>
        </div>
      </Fieldset.Root>
    </Field.Root>
  );
}
