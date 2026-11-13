import { Field } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { Popover } from "@base-ui/react/popover";
import type { Locale } from "date-fns";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ChangeEventHandler, InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { Calendar, openingMonth } from "@/internal/Calendar";
import { formatShown, isRealDate, monthOf, readValue, textOf, todayIso } from "@/internal/dates";
import { FieldError } from "@/internal/FieldError";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";
import { usePortalScope } from "@/internal/usePortalScope";
import { warn, warnIfUnnamed } from "@/internal/warn";

export type DatePickerSize = "md" | "lg";

/** A date-fns locale object, from `design-system/date-locales`, such as `enGB`. */
export type DateLocale = Locale;

/** What `onValueChange` reports beside the value. */
export interface DatePickerChangeDetails {
  /** `type` when the person typed, pasted, or cut; `pick` when they chose a day in the calendar. */
  reason: "type" | "pick";
  /** The field's text after the change. */
  text: string;
  /**
   * Whether the value is a real date: a `yyyy-mm-dd` day that exists. False for an empty field and for text that isn't
   * a date, including one shaped like a date that doesn't exist ("2026-11-31"). The same answer as `isDateValue(value)`.
   */
  isDate: boolean;
}

/**
 * Whether a DatePicker's value is a real date: a `yyyy-mm-dd` day that exists. False for `""` (an empty field) and for
 * typed text that isn't a date, including text shaped like a date that doesn't exist ("2026-11-31", "2026-02-29").
 * Use it in the page's own check, when it checks: the component itself never decides what's valid.
 *
 * ```ts
 * if (value === "") return "Enter a start date.";
 * if (!isDateValue(value)) return "Enter a real date, like Nov 27, 2026.";
 * ```
 */
export function isDateValue(value: string): boolean {
  return isRealDate(value);
}

/** A date field needs a name a screen reader can announce: a visible label, or an `aria-label`. */
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
      /** Names the field for screen readers when there's no visible label, such as a date in a table row. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** Height and type size. Both meet target-min: 40px or 48px with a mouse, 44px or 52px on touch. Default: `md`. */
  size?: DatePickerSize;
  /**
   * The value: a `yyyy-mm-dd` date once what's typed reads as one, `""` when empty, and otherwise the text as typed,
   * so the page can say it isn't a real date. Use with `onValueChange` to control it.
   */
  value?: string;
  /** The starting value, usually a `yyyy-mm-dd` date. Any other text is shown and submitted as it is. */
  defaultValue?: string;
  /**
   * Called whenever the person changes the text (each keystroke, paste, or cut), whether or not the value changes, and
   * when they pick a different day. The value is a `yyyy-mm-dd` date once the text reads as one, and otherwise the
   * text, trimmed. Re-check the field here after a failed submit.
   */
  onValueChange?: (value: string, details: DatePickerChangeDetails) => void;
  /** The text field's own change event, on every keystroke. Its `target.value` is the shown text, not the date: use `onValueChange` for the value. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Called when the text field loses focus, after a typed date is tidied into the shown format. Form libraries use it to mark the field touched. */
  onBlur?: BaseInput.Props["onBlur"];
  /** The earliest day the calendar lets people pick, `yyyy-mm-dd`. An earlier typed date is kept: check it and show an error. */
  min?: string;
  /** The latest day the calendar lets people pick, `yyyy-mm-dd`. A later typed date is kept: check it and show an error. */
  max?: string;
  /** More days the calendar doesn't let people pick, such as weekends. Typed ones are kept: check them and show an error. */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * How dates are shown and read, the first day of the week, and the month and weekday names. Import one from
   * `design-system/date-locales`, such as `enGB`. The field's own words ("Choose date") stay English. Default: en-US.
   */
  locale?: DateLocale;
  /**
   * The day the calendar marks as today and opens on when the field is empty, `yyyy-mm-dd`. Default: the browser's
   * today, read each time the calendar opens. Set it for previews and tests, or a page that works in another time zone.
   */
  today?: string;
  /** Help text between the label and the field, such as an example date ("For example, Nov 27, 2026."). Linked to the input for screen readers. */
  description?: ReactNode;
  /** The message shown between the description and the field when `invalid` is true, with an icon. Linked to the input. */
  error?: ReactNode;
  /** Marks the field as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks typing and the calendar, and removes the field from the tab order. A disabled field isn't submitted. */
  disabled?: boolean;
  /** Keeps the field focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the label, and no calendar button. */
  readOnly?: boolean;
  /** Tells assistive technology and the form that the field must be filled in. Say so in the label too, in words. It only checks the field isn't empty. */
  required?: boolean;
  /** Identifies the field when the form is submitted. The form gets the `yyyy-mm-dd` date, not the shown text. */
  name?: string;
  /** The id of the input. The label already points to it; set it to link an outside `<label htmlFor>` instead. */
  id?: string;
  /** The id of a `<form>` to submit with, when the field sits outside that form. */
  form?: string;
  /** What the browser may fill in. Default: `off`, since autofill would put dates in its own format into the field. */
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  /** Example text shown while the field is empty. Put the example date in the description instead, where it stays. */
  placeholder?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the visible `<input>` element, for focusing it, such as on an error. */
  ref?: Ref<HTMLInputElement>;
}

export type DatePickerProps = Labelled &
  OwnProps &
  Omit<
    BaseInput.Props,
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
    | "step"
    | keyof OwnProps
  >;

/**
 * Props left out of the type that would silently do the wrong thing if passed anyway from JavaScript, so they're
 * dropped: the input must stay a text field with the full keyboard, and `pattern`, the lengths, and `step` would check
 * or shape the shown text ("Nov 12, 2026"), not the date.
 */
const dropped = ["type", "inputMode", "pattern", "maxLength", "minLength", "list", "multiple", "step", "render", "children"] as const;

function withoutDropped<T extends object>(props: T): T {
  const kept = { ...props } as Record<string, unknown>;
  for (const name of dropped) delete kept[name];
  return kept as T;
}

/** A `yyyy-mm-dd` prop that isn't a real date warns and is ignored. */
function checkedDate(prop: string, value: string | undefined): string | undefined {
  if (value === undefined || isRealDate(value)) return value;
  warn("DatePicker", `${prop} (${JSON.stringify(value)}) isn't a date in yyyy-mm-dd form, such as "2026-11-12", so it's ignored.`);
  return undefined;
}

/** Lucide's calendar. Its line width comes from the CSS. */
function CalendarIcon() {
  return (
    <svg
      className="inset-button__icon date-picker__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

/**
 * A text field for one date, typed or picked from a calendar. The value, and what the form submits, is a date-only
 * `yyyy-mm-dd` string once what's typed reads as a date, so time zones can't shift it, and otherwise the text as typed,
 * so the page can say it isn't a real date. It reads dates typed in several forms ("11/12/2026", "12 Nov 2026") on
 * every keystroke, and tidies them into the locale's format ("Nov 12, 2026") when you leave the field. A button at the
 * end of the field opens a month calendar. For a date near today, such as a start date or a deadline; for a date people
 * know by heart, such as a date of birth, say in the description that typing is fine. Built on Base UI's Field and
 * Popover, with React DayPicker's calendar.
 */
export function DatePicker(props: DatePickerProps) {
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
    onChange,
    min: minProp,
    max: maxProp,
    isDateUnavailable,
    locale,
    today: todayProp,
    disabled,
    readOnly,
    required,
    name,
    id,
    form,
    autoComplete,
    placeholder,
    ref,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
  } = withoutDropped(props);
  warnIfUnnamed("DatePicker", label, rest, "Give it a label or an aria-label.");
  const min = checkedDate("min", minProp);
  const max = checkedDate("max", maxProp);
  const todayFixed = checkedDate("today", todayProp);
  if (min && max && min > max) {
    warn("DatePicker", `min (${JSON.stringify(min)}) is after max (${JSON.stringify(max)}), so no day can be picked. Swap them.`);
  }

  // The value, and the field's own text. Uncontrolled, the value always follows the text.
  const controlled = value !== undefined;
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");
  const currentValue = controlled ? value : ownValue;
  const [text, setText] = useState(() => textOf(currentValue, locale));
  const edited = useRef(false);

  // The one rule that ties the text to the value: if the text doesn't read as the value, it's replaced by the value's
  // own text. A page that follows onValueChange always holds what the text reads as, so typing is left alone; a page
  // that ignores it undoes the keystroke, as a controlled <input> does; a page that sets a new value replaces the text.
  const valueText = textOf(currentValue, locale);
  const textReadsAs = useMemo(() => readValue(text, locale), [text, locale]);
  if (text !== valueText && textReadsAs !== currentValue) setText(valueText);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  const change = (next: string, reason: DatePickerChangeDetails["reason"], shown: string) => {
    if (!controlled) setOwnValue(next);
    setText(shown);
    onValueChange?.(next, { reason, text: shown, isDate: isRealDate(next) });
  };

  const handleText = (next: string) => {
    edited.current = true;
    change(readValue(next, locale), "type", next);
  };

  /** After an edit since the field was focused, a date is rewritten in the shown format. */
  const tidy = () => {
    // flushSync, so the field shows the tidied text before the page's own onBlur or onKeyDown handler reads it
    if (edited.current && isRealDate(currentValue)) flushSync(() => setText(formatShown(currentValue, locale)));
    edited.current = false;
  };

  // Form reset: back to defaultValue, uncontrolled. The reset event fires before the browser resets the fields.
  const defaultRef = useRef(defaultValue ?? "");
  defaultRef.current = defaultValue ?? "";
  useEffect(() => {
    const formElement = inputRef.current?.form;
    if (!formElement || controlled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      timer = setTimeout(() => {
        setOwnValue(defaultRef.current);
        setText(textOf(defaultRef.current, locale));
        edited.current = false;
      }, 0);
    };
    formElement.addEventListener("reset", onReset);
    return () => {
      formElement.removeEventListener("reset", onReset);
      clearTimeout(timer);
    };
  }, [controlled, form, locale]);

  // The calendar
  const [open, setOpen] = useState(false);
  const showButton = !readOnly;
  // A field that becomes disabled or read-only closes its calendar for good, so it doesn't reopen by itself, and take
  // focus, when the field is enabled again
  if (open && (disabled || readOnly)) setOpen(false);
  const isOpen = open && showButton && !disabled;
  const [month, setMonth] = useState(() => openingMonth({ value: currentValue, today: todayFixed ?? todayIso(), min, max }));
  const [today, setToday] = useState(() => todayFixed ?? todayIso());
  // While open, a new date from the page moves the calendar to its month
  const [shownFor, setShownFor] = useState(currentValue);
  if (shownFor !== currentValue) {
    setShownFor(currentValue);
    if (isOpen && isRealDate(currentValue) && monthOf(currentValue) !== month) setMonth(monthOf(currentValue));
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const scope = usePortalScope(rootRef, isOpen);

  const openChange = (next: boolean) => {
    if (next) {
      const day = todayFixed ?? todayIso();
      setToday(day);
      setMonth(openingMonth({ value: currentValue, today: day, min, max }));
    }
    setOpen(next);
  };

  const pick = (date: string) => {
    setOpen(false);
    edited.current = false;
    if (date !== currentValue) change(date, "pick", formatShown(date, locale));
  };

  /** Opening focuses the grid's Tab-stop day, else an available month button, else the popup itself. */
  const initialFocus = () => {
    const popup = popupRef.current;
    const day = popup?.querySelector<HTMLElement>('[role="grid"] button[tabindex="0"]:not(:disabled)');
    const monthButton = popup?.querySelector<HTMLElement>('.calendar__nav-button:not([aria-disabled="true"])');
    return day ?? monthButton ?? popup ?? true;
  };

  /** Closing returns focus to the calendar button, or to the input when the button is gone (read-only). */
  const finalFocus = () => {
    const trigger = triggerRef.current;
    if (trigger?.isConnected && !trigger.disabled) return trigger;
    return inputRef.current && !inputRef.current.disabled ? inputRef.current : true;
  };

  // The button's name includes the field's, so two date fields don't give two identical buttons
  const buttonTextId = useId();
  const labelTextId = useId();
  const ariaLabel = rest["aria-label"];
  const buttonName = ariaLabel
    ? { "aria-label": `Choose date, ${ariaLabel}` }
    : { "aria-labelledby": `${buttonTextId} ${labelTextId}` };

  return (
    <Field.Root
      ref={rootRef}
      className={cx("text-field", "date-picker", className)}
      data-size={size}
      disabled={disabled}
      invalid={invalid}
    >
      {label !== undefined && (
        <Field.Label className="field-label date-picker__label">
          <span id={labelTextId}>{label}</span>
          {readOnly && !disabled && <ReadOnlyNote />}
        </Field.Label>
      )}
      {description && <Field.Description className="field-description date-picker__description">{description}</Field.Description>}
      {error && (
        <FieldError className="date-picker__error" match={invalid}>
          {error}
        </FieldError>
      )}
      <div className="date-picker__box" data-button={showButton ? true : undefined}>
        <BaseInput
          {...rest}
          ref={setInputRef}
          className="text-field__control date-picker__control"
          type="text"
          id={id}
          form={form}
          value={text}
          onValueChange={handleText}
          onChange={onChange}
          onFocus={(event) => {
            edited.current = false;
            onFocus?.(event);
          }}
          onBlur={(event) => {
            tidy();
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === "Enter" && !event.defaultPrevented) tidy();
          }}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete ?? "off"}
        />
        {showButton && (
          <Popover.Root open={isOpen} onOpenChange={openChange}>
            <Popover.Trigger ref={triggerRef} className="inset-button date-picker__button" disabled={disabled} {...buttonName}>
              {!ariaLabel && (
                <span className="visually-hidden" id={buttonTextId}>
                  Choose date,
                </span>
              )}
              <CalendarIcon />
            </Popover.Trigger>
            <Popover.Portal {...scope}>
              <Popover.Positioner
                className="date-picker__positioner"
                side="bottom"
                align="end"
                sideOffset={8} // --space-2: Base UI takes px
                collisionPadding={4} // --space-1: leaves a 308px touch calendar room at 320px wide
              >
                <Popover.Popup
                  ref={popupRef}
                  className="date-picker__popup"
                  initialFocus={initialFocus}
                  finalFocus={finalFocus}
                  {...buttonName}
                >
                  <Calendar
                    value={currentValue}
                    onPick={pick}
                    month={month}
                    onMonthChange={setMonth}
                    min={min}
                    max={max}
                    today={today}
                    isDateUnavailable={isDateUnavailable}
                    locale={locale}
                    dir={scope.dir === "rtl" ? "rtl" : undefined}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
      <input type="hidden" name={name} value={currentValue} form={form} disabled={disabled} />
    </Field.Root>
  );
}
