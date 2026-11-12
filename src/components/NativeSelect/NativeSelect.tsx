import { Field } from "@base-ui/react/field";
import { useRef } from "react";
import type { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { cx } from "@/internal/cx";
import { FieldError } from "@/internal/FieldError";
import { warn, warnIfUnnamed } from "@/internal/warn";

export type NativeSelectSize = "md" | "lg";

/** One choice in the list. */
export interface NativeSelectOption {
  /** What the form submits, and what `value` and `onValueChange` use. An empty value counts as no choice for `required`. */
  value: string;
  /** The words shown for it. Plain text: an option can't show anything else. */
  label: string;
  /** Shown but can't be chosen. */
  disabled?: boolean;
}

/** A labelled group of options, drawn as a heading in the open list (an `<optgroup>`). */
export interface NativeSelectGroup {
  /** The group's heading. It can't be chosen. */
  label: string;
  /** The options under the heading. */
  options: NativeSelectOption[];
  /** Disables every option in the group. */
  disabled?: boolean;
}

/** A select needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the select for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the select for screen readers when there's no visible label, such as a sort order in a toolbar. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** The choices, in order: options, and groups of options under a heading. */
  options: (NativeSelectOption | NativeSelectGroup)[];
  /**
   * Words for an empty first choice, such as "Choose a status". It's chosen to start with, submits an empty value,
   * and stays choosable, so an optional select can be cleared; a `required` one fails the form's check while it's
   * chosen. Without it, the first option is chosen to start with. Don't combine it with an option of your own whose
   * value is empty.
   */
  placeholder?: string;
  /** Height and type size, matching Input's. Default: `md`. */
  size?: NativeSelectSize;
  /** The chosen option's value. Use with `onValueChange` to control it. */
  value?: string;
  /**
   * The option chosen to start with, when you don't control it. It's applied once, when the select first appears, so
   * if the options load later, pass `value` instead, or render the select once they've arrived.
   */
  defaultValue?: string;
  /** Called when a different option is chosen, with its value. */
  onValueChange?: (value: string, eventDetails: Field.Control.ChangeEventDetails) => void;
  /** Help text between the label and the field. Linked to the select for screen readers. */
  description?: ReactNode;
  /** The message shown between the description and the field when `invalid` is true, with an icon. Linked to the select. */
  error?: ReactNode;
  /** Marks the select as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks changes and removes the select from the tab order. A disabled select isn't submitted. */
  disabled?: boolean;
  /** Tells assistive technology and the form that a choice must be made. Say so in the label too, in words. */
  required?: boolean;
  /** Identifies the field when the form is submitted. */
  name?: string;
  /** The id of the select. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the select sits outside that form. */
  form?: string;
  /** What the browser may fill in, such as `country`. */
  autoComplete?: SelectHTMLAttributes<HTMLSelectElement>["autoComplete"];
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the `<select>` element. */
  ref?: Ref<HTMLSelectElement>;
}

export type NativeSelectProps = Labelled &
  OwnProps &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "className" | "children" | "multiple" | "size" | "readOnly" | "aria-label" | keyof OwnProps
  >;

/** A downward chevron, drawn as Lucide's chevron-down. Its line width comes from the CSS. */
function ChevronIcon() {
  return (
    <svg
      className="native-select__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const isGroup = (item: NativeSelectOption | NativeSelectGroup): item is NativeSelectGroup => "options" in item;

/**
 * Keys for options and groups: an option's value, or a group's label, so React moves an element when the list changes
 * instead of rewriting it where it stands. Rewritten in place, an uncontrolled select's choice would move to whichever
 * option now sits there, and the form would send a value nobody picked. A repeated one gets a count added.
 */
function keyMaker() {
  const seen = new Map<string, number>();
  return (key: string) => {
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count === 0 ? key : `${key}#${count}`;
  };
}

/** Every option's value, groups included, in order */
const valuesOf = (options: OwnProps["options"]) =>
  options.flatMap((item) => (isGroup(item) ? item.options.map((option) => option.value) : [item.value]));

/**
 * A value that matches none of the options makes React choose the first one instead, so what's shown and submitted
 * isn't the value the page holds. Quiet before any options have arrived, since they're often still loading.
 */
function warnIfNoMatch(values: string[], hasPlaceholder: boolean, value: string | undefined) {
  if (value === undefined) return;
  if (values.length === 0 || values.includes(value) || (hasPlaceholder && value === "")) return;
  warn(
    "NativeSelect",
    `value "${value}" matches none of its options, so it shows something other than the value it holds. Pass one of the options' values, or add a placeholder for an empty value.`,
  );
}

/**
 * A field for choosing one option from a list: a real `<select>` with its label, an optional description, and an
 * error. The browser draws the open list (the phone's own picker on a phone) and handles the keyboard, and the value
 * is submitted with the form. Built on Base UI's Field, so the label, description, and error are linked to the select
 * for screen readers. For two to five choices that fit on screen, a RadioGroup or SegmentedControl is usually
 * clearer; to choose several, use a CheckboxGroup.
 *
 * It can't be read-only: browsers ignore `readonly` on a select, and screen readers aren't told. To show a value that
 * can't be changed, use `disabled`, or show the value as text.
 */
export function NativeSelect({
  label,
  options,
  placeholder,
  description,
  error,
  invalid,
  className,
  disabled,
  required,
  name,
  id,
  size = "md",
  value,
  defaultValue,
  onValueChange,
  ref,
  ...rest
}: NativeSelectProps) {
  // Left out of the props type, and dropped if passed anyway from JavaScript: a select ignores readOnly, multiple would
  // turn the value into a list, and children would replace the options
  const { readOnly: _readOnly, multiple: _multiple, children: _children, ...props } = rest as typeof rest & {
    readOnly?: unknown;
    multiple?: unknown;
    children?: unknown;
  };
  warnIfUnnamed("NativeSelect", label, props, "Give it a label or an aria-label.");
  const hasPlaceholder = placeholder !== undefined && placeholder.trim() !== "";
  const values = valuesOf(options);
  warnIfNoMatch(values, hasPlaceholder, value !== undefined ? value : defaultValue);
  // React applies defaultValue once, on the first render. If the options weren't there yet, the browser chose the
  // first one when they arrived, whatever defaultValue says. (A controlled value is applied on every render.)
  const startedEmpty = useRef(values.length === 0);
  if (startedEmpty.current && values.length > 0 && value === undefined && defaultValue !== undefined) {
    warn(
      "NativeSelect",
      `defaultValue "${defaultValue}" was set before any options arrived, so the browser chose the first option instead. Pass value while the options load, or render the select once they have.`,
    );
  }

  const optionKey = keyMaker();
  const groupKey = keyMaker();
  const optionElement = (option: NativeSelectOption) => (
    <option key={optionKey(option.value)} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
  const optionElements = options.map((item) =>
    isGroup(item) ? (
      <optgroup key={`group:${groupKey(item.label)}`} label={item.label} disabled={item.disabled}>
        {item.options.map(optionElement)}
      </optgroup>
    ) : (
      optionElement(item)
    ),
  );

  return (
    <Field.Root className={cx("text-field", "native-select", className)} data-size={size} name={name} disabled={disabled} invalid={invalid}>
      {label !== undefined && <Field.Label className="field-label native-select__label">{label}</Field.Label>}
      {description && <Field.Description className="field-description native-select__description">{description}</Field.Description>}
      {error && (
        <FieldError className="native-select__error" match={invalid}>
          {error}
        </FieldError>
      )}
      <div className="native-select__box">
        {/* Base UI has no native select, so its field control renders one, as TextArea's renders a textarea. Every
            prop goes through Field.Control, which merges a consumer's aria-describedby with the description and
            error; only the options go on the select itself. Its props are typed for an <input>, hence the cast. */}
        <Field.Control
          {...(props as Field.Control.Props)}
          ref={ref}
          className="text-field__control native-select__control"
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
          required={required}
          render={
            <select>
              {hasPlaceholder && (
                <option value="" className="native-select__placeholder">
                  {placeholder}
                </option>
              )}
              {optionElements}
            </select>
          }
        />
        <ChevronIcon />
      </div>
    </Field.Root>
  );
}
