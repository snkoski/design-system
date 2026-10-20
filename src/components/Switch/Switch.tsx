import { Field } from "@base-ui/react/field";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactNode, Ref } from "react";

/** A switch needs a name a screen reader can announce: visible label text, or an `aria-label`. */
type Labelled =
  | { children: Exclude<ReactNode, undefined | null | boolean>; "aria-label"?: string }
  | { children?: undefined; "aria-label": string };

interface OwnProps {
  /** Whether the switch is on. Use with `onCheckedChange` to control it. */
  checked?: boolean;
  /** Whether the switch starts on, when you don't control it. Default: `false`. */
  defaultChecked?: boolean;
  /** Called when the switch is turned on or off, with the new value. */
  onCheckedChange?: (checked: boolean, eventDetails: BaseSwitch.Root.ChangeEventDetails) => void;
  /** Blocks all interaction and removes the switch from the tab order. */
  disabled?: boolean;
  /** Keeps the switch focusable and readable, but blocks changes. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that this switch must be on. Say so in the label too, in words. */
  required?: boolean;
  /** Marks the switch as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Identifies the field when the form is submitted. */
  name?: string;
  /**
   * The id of the hidden `<input>`, not of the visible switch. A `<label htmlFor>` pointing at it
   * toggles the switch but doesn't give it a name screen readers announce, so label it with
   * `children` or `aria-label` instead.
   */
  id?: string;
  /** The id of a `<form>` to submit with, when the switch sits outside that form. */
  form?: string;
  /** What the switch submits with the form when it's on. Without it, the browser's default `on` is submitted. */
  value?: string;
  /** What the switch submits when it's off. Without it, an off switch submits nothing, like a native checkbox. */
  uncheckedValue?: string;
  /** Secondary text under the label. Linked to the switch so screen readers read it too. */
  description?: ReactNode;
  /** The message shown when `invalid` is true, with an icon. Linked to the switch. */
  error?: ReactNode;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the focusable switch element. */
  ref?: Ref<HTMLElement>;
  /** Reaches the hidden `<input>` that takes part in the form. */
  inputRef?: Ref<HTMLInputElement>;
}

export type SwitchProps = Labelled &
  OwnProps &
  Omit<BaseSwitch.Root.Props, "className" | "render" | "nativeButton" | "children" | "aria-label" | keyof OwnProps>;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function ErrorIcon() {
  return (
    <svg
      className="switch__error-icon"
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
 * An on/off control for a setting, with its label. Built on Base UI's Switch and Field, so the
 * label, description, and error are linked to the switch for screen readers, and it takes part in forms.
 * Clicking the label text turns it on or off. Use a checkbox instead for choices in a list,
 * for agreeing to something, or when you need a mixed state.
 */
export function Switch({
  children,
  description,
  error,
  invalid,
  className,
  disabled,
  name,
  ...rest
}: SwitchProps) {
  const control = (
    <BaseSwitch.Root {...rest} className="switch__track" disabled={disabled} name={name}>
      <BaseSwitch.Thumb className="switch__thumb" />
    </BaseSwitch.Root>
  );

  return (
    <Field.Root className={cx("switch", className)} name={name} disabled={disabled} invalid={invalid}>
      {children === undefined ? (
        control
      ) : (
        <Field.Label className="switch__row">
          {control}
          <span className="switch__label">{children}</span>
        </Field.Label>
      )}
      {description && <Field.Description className="switch__description">{description}</Field.Description>}
      {error && (
        <Field.Error className="switch__error" match={invalid}>
          <ErrorIcon />
          <span>{error}</span>
        </Field.Error>
      )}
    </Field.Root>
  );
}
