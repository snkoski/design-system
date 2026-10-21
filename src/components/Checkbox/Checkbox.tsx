import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import { useContext } from "react";
import type { ReactNode, Ref } from "react";
import { CheckboxGroupContext } from "../CheckboxGroup/context";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { hasContent, warn, warnIfUnnamed } from "../../internal/warn";

/** A checkbox needs a name a screen reader can announce: visible label text, or an `aria-label`. */
type Labelled =
  | {
      /** The label text beside the box. The whole row is the click target. Required unless `aria-label` is set. */
      children: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the checkbox for screen readers. Usually not needed when there is label text, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The label text beside the box. The whole row is the click target. Required unless `aria-label` is set. */
      children?: undefined;
      /** Names the checkbox for screen readers when there's no visible label, such as a row in a table. Required without `children`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Whether the checkbox is ticked. Use with `onCheckedChange` to control it. Ignored inside a CheckboxGroup, whose value decides. */
  checked?: boolean;
  /** Whether the checkbox starts ticked, when you don't control it. Default: `false`. Ignored inside a CheckboxGroup, whose value decides. */
  defaultChecked?: boolean;
  /** Called when the checkbox is ticked or unticked, with the new value. */
  onCheckedChange?: (checked: boolean, eventDetails: BaseCheckbox.Root.ChangeEventDetails) => void;
  /**
   * Shows a dash instead of a tick: some, but not all, of a group's boxes are ticked.
   * Controlled by you. Clicking still calls `onCheckedChange`, and you decide what the next state is.
   */
  indeterminate?: boolean;
  /**
   * Makes this the "select all" box of a CheckboxGroup. The group ticks it, shows its dash, and ticks or
   * unticks every option when it's clicked. Only works inside a CheckboxGroup that has `allValues`;
   * without them it ticks only itself. A parent box has no `value` and isn't submitted.
   */
  parent?: boolean;
  /** Blocks all interaction and removes the checkbox from the tab order. */
  disabled?: boolean;
  /** Keeps the checkbox focusable and readable, but blocks changes. Inside a read-only CheckboxGroup, it's always read-only. */
  readOnly?: boolean;
  /**
   * Tells assistive technology and the form that this box must be ticked. Say so in the label too, in words.
   * Ignored inside a CheckboxGroup.
   */
  required?: boolean;
  /**
   * Marks the checkbox as failing validation. Pair it with `error` so the problem is in words, not just color.
   * Ignored inside a CheckboxGroup: set `invalid` on the group.
   */
  invalid?: boolean;
  /** Identifies the field when the form is submitted. Ignored inside a CheckboxGroup, which names every option. */
  name?: string;
  /**
   * The id of the hidden `<input>`, not of the visible checkbox. A `<label htmlFor>` pointing at it
   * toggles the checkbox but doesn't give it a name screen readers announce, so label it with
   * `children` or `aria-label` instead.
   */
  id?: string;
  /** The id of a `<form>` to submit with, when the checkbox sits outside that form. */
  form?: string;
  /**
   * What a ticked checkbox submits with the form. Without it, the browser's default `on` is submitted.
   * Required inside a CheckboxGroup, where it also identifies the option in the group's value.
   */
  value?: string;
  /**
   * What the checkbox submits when it's unticked. Without it, an unticked checkbox submits nothing, like a native one.
   * Ignored inside a CheckboxGroup.
   */
  uncheckedValue?: string;
  /** Secondary text under the label. Linked to the checkbox so screen readers read it too. */
  description?: ReactNode;
  /** The message shown when `invalid` is true, with an icon. Linked to the checkbox. Ignored inside a CheckboxGroup: set `error` on the group. */
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

/**
 * A box that is ticked or unticked, with its label. Built on Base UI's Checkbox and Field, so the
 * label, description, and error are linked to the checkbox for screen readers, and it takes part in forms.
 * Clicking the label text ticks the box. Use it for options that can be chosen independently;
 * for exactly one choice from a list, use a RadioGroup. Inside a CheckboxGroup it becomes one of the
 * group's options: the group gives it its name, its ticked state, and its validity.
 */
export function Checkbox({
  children,
  description,
  error,
  invalid,
  className,
  disabled,
  name,
  readOnly,
  parent,
  indeterminate = false,
  ...rest
}: CheckboxProps) {
  const group = useContext(CheckboxGroupContext);
  // Inside a group, the group's value ticks the box and its field gives the name and validity
  const { checked, defaultChecked, uncheckedValue, required, ...groupable } = rest;

  warnIfUnnamed("Checkbox", children, rest, "Give it label text (children) or an aria-label.");
  if (group) {
    const option = parent ? "the parent box" : rest.value === undefined ? "an option" : `the option "${rest.value}"`;
    if (parent && !group.hasAllValues) {
      warn("Checkbox", "a parent box ticks only itself unless its CheckboxGroup has allValues. Pass every option's value as allValues.");
    }
    if (!parent && rest.value === undefined) {
      warn("Checkbox", `an option in a CheckboxGroup has no value, so it submits "on" and is listed under the group's name. Give each option a value.`);
    }
    const ignored = [
      name && "name (set it on the CheckboxGroup)",
      invalid && "invalid (set it on the CheckboxGroup)",
      hasContent(error) && "error (set it on the CheckboxGroup)",
      required && "required (a group has none: use invalid and error on the CheckboxGroup)",
      checked !== undefined && "checked (use the CheckboxGroup's value)",
      defaultChecked && "defaultChecked (use the CheckboxGroup's defaultValue)",
      uncheckedValue !== undefined && "uncheckedValue (a group submits only ticked options)",
    ].filter(Boolean);
    if (ignored.length > 0) {
      warn("Checkbox", `${option} in a CheckboxGroup ignores ${ignored.join(", ")}.`);
    }
  } else if (parent) {
    warn("Checkbox", "parent only works inside a CheckboxGroup that has allValues.");
  }

  const box = (
    <BaseCheckbox.Root
      {...(group ? groupable : rest)}
      className="checkbox__box sheen"
      disabled={disabled}
      name={group ? undefined : name}
      readOnly={readOnly || group?.readOnly}
      parent={parent}
      indeterminate={indeterminate}
    >
      <BaseCheckbox.Indicator
        className="checkbox__indicator"
        render={(props, state) => (
          <span {...props}>
            {/* The group decides when a parent box is mixed, so read it from Base UI's state */}
            <Mark indeterminate={state.indeterminate} />
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );

  const content = (
    <>
      {children === undefined ? (
        box
      ) : (
        <Field.Label className="checkbox__row">
          {box}
          <span className="checkbox__label">{children}</span>
        </Field.Label>
      )}
      {description && <Field.Description className="checkbox__description">{description}</Field.Description>}
    </>
  );

  // In a group, each checkbox is an item of the group's field rather than a field of its own
  if (group) {
    return (
      <Field.Item className={cx("checkbox", className)} disabled={disabled} data-parent={parent || undefined}>
        {content}
      </Field.Item>
    );
  }

  return (
    <Field.Root className={cx("checkbox", className)} name={name} disabled={disabled} invalid={invalid}>
      {content}
      {error && (
        <FieldError className="checkbox__error" match={invalid}>
          {error}
        </FieldError>
      )}
    </Field.Root>
  );
}
