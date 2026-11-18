import { Button as BaseButton } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, InputHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { FieldError } from "@/internal/FieldError";
import { useMergedRef } from "@/internal/useMergedRef";
import { warnIfUnnamed } from "@/internal/warn";

export type FileInputSize = "md" | "lg";

/** A file field needs a name a screen reader can announce: a visible label, or an `aria-label`. */
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
      /** Names the field for screen readers when there's no visible label, such as a file in a table row. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Height and type size. Both meet target-min: 40px or 48px with a mouse, 44px or 52px on touch. Default: `md`. */
  size?: FileInputSize;
  /**
   * The kinds of file the picker offers, such as `.pdf,.docx` or `image/*`. It only filters the picker: a file of
   * another kind can still be chosen or dropped, so the page checks each file. Say the kinds in `description` too.
   */
  accept?: string;
  /** Lets several files be chosen at once. Use it only when several are really expected. */
  multiple?: boolean;
  /** On a phone, opens the camera instead of the file list: `user` for the front camera, `environment` for the back. */
  capture?: InputHTMLAttributes<HTMLInputElement>["capture"];
  /**
   * Called with every chosen file whenever the choice changes, and with `[]` when Remove is pressed. Not called on a
   * form reset. Runs after `onChange`.
   */
  onFilesChange?: (files: File[], event: ChangeEvent<HTMLInputElement>) => void;
  /** Help text between the label and the field, read before choosing: say the kinds of file and the size limit. */
  description?: ReactNode;
  /** The message shown between the description and the field when `invalid` is true, with an icon. Linked to the field. */
  error?: ReactNode;
  /** Marks the field as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks choosing and removing, and takes the field out of the tab order. A disabled field isn't submitted. */
  disabled?: boolean;
  /** Tells assistive technology and the form that a file must be chosen. Don't mark it in the label: mark the fields that aren't required "(optional)" instead (see Forms). */
  required?: boolean;
  /** Identifies the field when the form is submitted. Each chosen file is sent under it. */
  name?: string;
  /** The id of the input. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the field sits outside that form. */
  form?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the `<input>` element, which holds the chosen files (`ref.current.files`). */
  ref?: Ref<HTMLInputElement>;
}

export type FileInputProps = Labelled &
  OwnProps &
  Omit<
    BaseInput.Props,
    | "className"
    | "render"
    | "children"
    | "aria-label"
    | "type"
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "readOnly"
    | "placeholder"
    | "autoComplete"
    | "inputMode"
    | "pattern"
    | "min"
    | "max"
    | "step"
    | "maxLength"
    | "minLength"
    | "list"
    | "checked"
    | "defaultChecked"
    | keyof OwnProps
  >;

/**
 * Props left out of the type that would throw or silently do the wrong thing if passed anyway from JavaScript, so
 * they're dropped: a file input's value can only be emptied, `onValueChange` would get the browser's fake path
 * ("C:\fakepath\cv.pdf"), and browsers ignore `readOnly` on a file input, so it would look read-only and still open the
 * picker.
 */
const dropped = ["value", "defaultValue", "onValueChange", "readOnly", "type", "render", "children"] as const;

function withoutDropped<T extends object>(props: T): T {
  const kept = { ...props } as Record<string, unknown>;
  for (const name of dropped) delete kept[name];
  return kept as T;
}

/** Lucide's X. Its line width comes from the CSS. */
/** The names of the files an input holds */
const namesOf = (files: FileList | null | undefined) => [...(files ?? [])].map((file) => file.name);

/** Lucide's upload icon, before the field's words. Decorative: the field's name already says what it's for. */
function UploadIcon() {
  return (
    <svg
      className="file-input__upload"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="M12 3v12" />
      <path d="m17 8-5-5-5 5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      className="inset-button__icon file-input__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** Tells everything listening that the input's files changed, as the browser does when a file is chosen. */
function announceChange(input: HTMLInputElement) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * A field for choosing one file, or several, to send with a form: the browser's own file input, drawn as one button
 * that says "Choose file", then the chosen file's name or how many, with a label, a description, and an error. The
 * words are drawn over the input, the same in every browser; screen readers hear the browser's. While a file is
 * chosen, a Remove button at the end of the field empties it again, which the browser's input can't do. The page checks
 * each file's kind and size and uploads it; `accept` only filters the picker. Built on Base UI's Field and Input, like
 * Input.
 */
export function FileInput(props: FileInputProps) {
  const {
    label,
    description,
    error,
    invalid,
    className,
    disabled,
    size = "md",
    multiple,
    name,
    form,
    onChange,
    onFilesChange,
    ref,
    ...rest
  } = withoutDropped(props);
  warnIfUnnamed("FileInput", label, rest, "Give it a label or an aria-label.");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useMergedRef(inputRef, ref);

  // The chosen files' names, for the words on the field and the Remove button. Read from the input, never assumed: on
  // mount (a browser may restore files after Back), on every change, and after a form reset.
  const [names, setNames] = useState<string[]>([]);
  const readNames = useCallback(() => setNames(namesOf(inputRef.current?.files)), []);
  useEffect(readNames, [readNames]);
  const count = names.length;

  // Form reset empties the input but fires no change. The reset event fires before the browser resets the fields.
  useEffect(() => {
    const formElement = inputRef.current?.form;
    if (!formElement) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      timer = setTimeout(readNames, 0);
    };
    formElement.addEventListener("reset", onReset);
    return () => {
      formElement.removeEventListener("reset", onReset);
      clearTimeout(timer);
    };
  }, [form, readNames]);

  const handleChange = (event: Parameters<NonNullable<BaseInput.Props["onChange"]>>[0]) => {
    const files = [...(event.currentTarget.files ?? [])];
    setNames(files.map((file) => file.name));
    onChange?.(event);
    onFilesChange?.(files, event);
  };

  // Clicking the label focuses the field, as a text field's label does, instead of opening the picker, which is what a
  // label does to a file input by default. The ring shows, as it would for a text field. A link in the label still
  // works.
  const focusFromLabel = (event: MouseEvent<HTMLLabelElement>) => {
    if (event.target instanceof Element && event.target.closest("a, button, input, select, textarea")) return;
    event.preventDefault();
    inputRef.current?.focus({ focusVisible: true });
  };

  const remove = () => {
    const input = inputRef.current;
    if (!input || disabled) return;
    input.value = "";
    announceChange(input);
    input.focus();
  };

  // A file dropped on the Remove button goes to the field, as if it had landed on the input. Without this, the browser
  // would open the file in the tab and leave the form. The input itself takes its own drops.
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (event.target === inputRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (!input || event.target === input) return;
    event.preventDefault();
    const dropped = [...event.dataTransfer.files];
    if (disabled || dropped.length === 0) return;
    const chosen = new DataTransfer();
    for (const file of multiple ? dropped : dropped.slice(0, 1)) chosen.items.add(file);
    input.files = chosen.files;
    announceChange(input);
  };

  // The Remove button's name includes the field's, so two file fields don't give two identical buttons
  const removeTextId = useId();
  const labelTextId = useId();
  const ariaLabel = rest["aria-label"];
  const removeWords = count === 1 ? "Remove file" : "Remove files";
  // Whatever names the field: an aria-label, the visible label, or the elements aria-labelledby points at
  const removeName = ariaLabel
    ? { "aria-label": `${removeWords}, ${ariaLabel}` }
    : { "aria-labelledby": `${removeTextId} ${label !== undefined ? labelTextId : (rest["aria-labelledby"] ?? "")}`.trim() };

  return (
    <Field.Root
      className={cx("text-field", "file-input", className)}
      data-size={size}
      name={name}
      disabled={disabled}
      invalid={invalid}
    >
      {label !== undefined && (
        <Field.Label className="field-label file-input__label" onClick={focusFromLabel}>
          <span id={labelTextId}>{label}</span>
        </Field.Label>
      )}
      {description && <Field.Description className="field-description file-input__description">{description}</Field.Description>}
      {error && (
        <FieldError className="file-input__error" match={invalid}>
          {error}
        </FieldError>
      )}
      <div
        className="file-input__box"
        data-has-files={count > 0 ? true : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="file-input__face" aria-hidden="true">
          <UploadIcon />
          <span className="file-input__words">{count === 0 ? "Choose file" : count === 1 ? names[0] : `${count} files`}</span>
        </span>
        <BaseInput
          {...rest}
          ref={setInputRef}
          className="text-field__control file-input__control"
          type="file"
          multiple={multiple}
          name={name}
          form={form}
          disabled={disabled}
          onChange={handleChange}
        />
        {count > 0 && (
          <BaseButton className="inset-button file-input__remove" disabled={disabled} onClick={remove} {...removeName}>
            {!ariaLabel && (
              <span className="visually-hidden" id={removeTextId}>
                {removeWords},
              </span>
            )}
            <RemoveIcon />
          </BaseButton>
        )}
      </div>
    </Field.Root>
  );
}
