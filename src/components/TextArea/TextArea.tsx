import { Field } from "@base-ui/react/field";
import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { ReadOnlyNote } from "../../internal/ReadOnlyNote";
import { warnIfUnnamed } from "../../internal/warn";

export type TextAreaSize = "md" | "lg";
export type TextAreaResize = "vertical" | "none";

/** A text area needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the text area for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the text area for screen readers when there's no visible label. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Type size and inner padding, matching Input's sizes so the two line up in a form. Default: `md`. */
  size?: TextAreaSize;
  /** How many lines tall it starts. Default: 4. */
  rows?: number;
  /**
   * Whether people can drag it taller. It never gets wider: width is the layout's job. A disabled text area
   * can't be resized. Default: `vertical`.
   */
  resize?: TextAreaResize;
  /** The text in the field. Use with `onValueChange` to control it. */
  value?: string;
  /** The text the field starts with, when you don't control it. */
  defaultValue?: string;
  /** Called on every change with the new text. */
  onValueChange?: (value: string, eventDetails: Field.Control.ChangeEventDetails) => void;
  /** Help text between the label and the field, read before typing. Linked to the text area for screen readers. */
  description?: ReactNode;
  /** The message shown between the description and the field when `invalid` is true, with an icon. Linked to the text area. */
  error?: ReactNode;
  /** Marks the text area as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks typing and removes the text area from the tab order. A disabled text area isn't submitted. */
  disabled?: boolean;
  /** Keeps the text area focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the label. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that the field must be filled in. Say so in the label too, in words. */
  required?: boolean;
  /** Identifies the field when the form is submitted. */
  name?: string;
  /** The id of the text area. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the text area sits outside that form. */
  form?: string;
  /** What the browser may fill in, such as `street-address`. Set it on fields that ask about the person (WCAG 1.3.5). */
  autoComplete?: TextareaHTMLAttributes<HTMLTextAreaElement>["autoComplete"];
  /** Which on-screen keyboard to show, such as `text`, without changing validation. */
  inputMode?: TextareaHTMLAttributes<HTMLTextAreaElement>["inputMode"];
  /** Example text shown while the field is empty. Never a substitute for the label: it disappears as you type. */
  placeholder?: string;
  /** The most characters it takes. The browser stops typing at the limit, so say what the limit is in the description. */
  maxLength?: number;
  /** The fewest characters the form accepts, checked by the browser when the form is submitted. */
  minLength?: number;
  /** Whether the browser checks spelling. Turn it off for code, names, or anything that isn't prose. */
  spellCheck?: boolean;
  /** `hard` submits the text with line breaks where it wraps on screen; `soft`, the default, submits it as typed. */
  wrap?: "soft" | "hard";
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the `<textarea>` element, for focusing or selecting its text. */
  ref?: Ref<HTMLTextAreaElement>;
}

export type TextAreaProps = Labelled &
  OwnProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "children" | "cols" | "aria-label" | keyof OwnProps>;

/**
 * A multi-line text field with its label, an optional description, and an error, for messages, comments, and
 * notes. Built on Base UI's Field, so the label, description, and error are linked to the text area for screen
 * readers, and it takes part in forms. Enter adds a new line rather than submitting the form. For a single line,
 * use Input.
 */
export function TextArea({
  label,
  description,
  error,
  invalid,
  className,
  disabled,
  readOnly,
  required,
  name,
  id,
  size = "md",
  resize = "vertical",
  rows = 4,
  value,
  defaultValue,
  onValueChange,
  ref,
  ...rest
}: TextAreaProps) {
  warnIfUnnamed("TextArea", label, rest, "Give it a label or an aria-label.");
  return (
    <Field.Root className={cx("text-field", "text-area", className)} data-size={size} data-resize={resize} name={name} disabled={disabled} invalid={invalid}>
      {label !== undefined && (
        <Field.Label className="field-label text-area__label">
          {label}
          {readOnly && !disabled && <ReadOnlyNote />}
        </Field.Label>
      )}
      {description && <Field.Description className="field-description text-area__description">{description}</Field.Description>}
      {error && (
        <FieldError className="text-area__error" match={invalid}>
          {error}
        </FieldError>
      )}
      {/* Base UI has no textarea, so its field control renders one. Every prop goes through Field.Control, which
          passes it on to the textarea and adds its own: a consumer's aria-describedby is merged with the
          description and error, rather than replacing them. Its props are typed for an <input>, hence the cast. */}
      <Field.Control
        {...(rest as Field.Control.Props)}
        ref={ref}
        className="text-field__control text-area__control"
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        render={<textarea rows={rows} />}
      />
    </Field.Root>
  );
}
