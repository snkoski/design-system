import { Button as BaseButton } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { ratingColor } from "@/internal/ratingColor";
import type { RatingColor } from "@/internal/ratingColor";
import { FieldError } from "@/internal/FieldError";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";
import { starPath } from "@/internal/star";
import { useMergedRef } from "@/internal/useMergedRef";
import { useResettableValue } from "@/internal/useResettableValue";
import { warn, warnIfUnnamed } from "@/internal/warn";

/** A rating needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the stars, naming what's being rated. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the rating for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the stars, naming what's being rated. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the rating for screen readers when there's no visible label. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** How many stars there are, valued 1 to `max`. Keep to 3 to 10, and to 5 or fewer on pages used on phones, so the stars and Clear fit on one line. Default: `5`. */
  max?: number;
  /** The chosen number of stars, or `null` for none. Use with `onValueChange` to control it. */
  value?: number | null;
  /** The number of stars chosen at the start, when you don't control it. Leave it out for none. */
  defaultValue?: number;
  /**
   * Called when the rating changes: with the number of stars when one is chosen, and with `null` when Clear is
   * pressed. A chosen star also passes Base UI's change details; calling `eventDetails.cancel()` keeps the rating as it was.
   */
  onValueChange?: (value: number | null, eventDetails?: BaseRadioGroup.ChangeEventDetails) => void;
  /** Identifies the field when the form is submitted. The chosen number is submitted as text ("3") under this name. */
  name?: string;
  /**
   * Tells assistive technology and the form that a rating must be given. Don't mark it in the label: mark the fields
   * that aren't required "(optional)" instead (see Forms). The browser then blocks the form from submitting until a
   * star is chosen. To show your own error instead, give the form `noValidate`, and set `invalid` and `error`. A
   * required rating has no Clear button.
   */
  required?: boolean;
  /** Help text between the label and the stars, read before choosing. Linked to the rating and to each star. */
  description?: ReactNode;
  /** The message shown between the description and the stars when `invalid` is true, with an icon. Linked to the rating and to each star. */
  error?: ReactNode;
  /** Marks the rating and every star as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /**
   * Blocks all interaction. A disabled rating isn't submitted and has no Clear button. Its chosen star can still be
   * reached with Tab, and is announced as disabled.
   */
  disabled?: boolean;
  /** Keeps the rating focusable, readable, and submitted, but blocks changes. Shows "Read only" beside the label, and no Clear button. The arrow keys move focus without choosing. */
  readOnly?: boolean;
  /**
   * The color of the filled stars. `"gold"` (the default) is a deep amber in light mode, bright gold in dark, and
   * ketchup red in hot dog. `"brand"` is Sherbet's tangerine, darkened in light mode, and ketchup in hot dog. Both are
   * checked for 3:1 on the page, cards, and tinted panels in every theme, but not on a `brand` band, where brand stars
   * vanish; keywords ignore case and spaces. Any other value is a CSS
   * color, like `"hsl(210 80% 46%)"` or `"var(--my-star)"`, used as given in every theme: check that it reaches 3:1
   * against the page in each theme you support. A value the browser can't use, or `"transparent"`, warns in
   * development. Windows Contrast themes ignore it. To change gold or brand everywhere, set
   * `--rating-gold` or `--rating-brand` in your brand file instead.
   */
  color?: RatingColor;
  /** The id of a `<form>` to submit with, when the rating sits outside that form. */
  form?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the element with the radiogroup role. */
  ref?: Ref<HTMLDivElement>;
}

export type RatingProps = Labelled &
  OwnProps &
  Omit<
    BaseRadioGroup.Props<number | null>,
    "className" | "render" | "aria-label" | "inputRef" | "children" | keyof OwnProps
  >;

/**
 * A row of stars for one score on a short scale, such as interest in a job, where more stars is better. Built on Base
 * UI's RadioGroup, Fieldset, and Field, so screen readers announce it as a radio group of stars ("3 stars, 3 of 5"),
 * the label, description, and error are linked to it, and it submits the number with the form. It's one Tab stop, and
 * the arrow keys move between stars and choose them. Once a star is chosen, a Clear button after the stars empties it
 * again. For answers that need words, such as how satisfied someone was, use a RadioGroup.
 */
export function Rating({
  label,
  description,
  error,
  invalid,
  disabled,
  readOnly,
  required,
  name,
  form,
  max = 5,
  value,
  defaultValue,
  onValueChange,
  className,
  color,
  ref,
  ...rest
}: RatingProps) {
  warnIfUnnamed("Rating", label, rest, "Give it a label or an aria-label.");
  const starColor = ratingColor("Rating", color);

  // A max that can't be counted would leave no stars, or a broken row, so it falls back to the default
  const maxIsValid = Number.isInteger(max) && max >= 1;
  if (!maxIsValid) warn("Rating", `max must be a whole number of 1 or more, like 5. Got ${max}.`);
  const count = maxIsValid ? max : 5;

  // Rating always gives Base UI's RadioGroup its value, so Clear can empty it (a radio can't be unchecked) and a form
  // reset can put the stars and the form's data back together
  const groupRef = useRef<HTMLDivElement | null>(null);
  const setGroupRef = useMergedRef(groupRef, ref);
  const { controlled, shown, setOwnValue } = useResettableValue({ value, defaultValue, groupRef, form });

  // A value that's no star shows nothing and sends nothing. defaultValue only counts on the first render; after that,
  // an uncontrolled value left without a star (max got smaller) is the person's, so the fix is to clear it.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const isStar = (number: number) => Number.isInteger(number) && number >= 1 && number <= count;
  if (shown !== null && !isStar(shown)) {
    const range = `Use a whole number from 1 to ${count}`;
    if (controlled) warn("Rating", `The value ${shown} isn't one of the stars. ${range}, or null for none.`);
    else if (!mounted.current) warn("Rating", `The defaultValue ${shown} isn't one of the stars. ${range}, or leave it out for none.`);
    else warn("Rating", `The value ${shown} isn't one of the stars. ${range}, or clear it.`);
  }

  const handleValueChange = (next: number | null, eventDetails: BaseRadioGroup.ChangeEventDetails) => {
    // null is how Rating tells Base UI nothing is chosen; a star is never null
    if (next === null) return;
    onValueChange?.(next, eventDetails);
    if (!controlled && !eventDetails.isCanceled) setOwnValue(next);
  };

  // Clear: shown while there's a value to clear and the person may change it
  const showClear = shown !== null && !required && !readOnly && !disabled;
  const clear = () => {
    if (!controlled) setOwnValue(null);
    onValueChange?.(null);
  };

  // When Clear disappears while it has focus (pressed, or the page made the rating required, read-only, disabled, or
  // empty), focus goes to the stars' Tab stop rather than the top of the page. React sends no blur for a removed
  // element, so the flag still says it had focus.
  const clearHadFocus = useRef(false);
  useLayoutEffect(() => {
    if (showClear || !clearHadFocus.current) return;
    clearHadFocus.current = false;
    groupRef.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus();
  }, [showClear]);

  // Clear's name includes the rating's, so two ratings don't give two identical buttons
  const clearTextId = useId();
  const labelTextId = useId();
  const ariaLabel = rest["aria-label"];
  // Whatever names the rating: an aria-label, the visible label, or the elements aria-labelledby points at
  const clearName = ariaLabel
    ? { "aria-label": `Clear rating, ${ariaLabel}` }
    : { "aria-labelledby": `${clearTextId} ${label !== undefined ? labelTextId : (rest["aria-labelledby"] ?? "")}`.trim() };

  const stars = Array.from({ length: count }, (_, index) => index + 1);

  return (
    <Field.Root
      className={cx("choice-group", "rating", className)}
      data-color={starColor["data-color"]}
      style={starColor.style}
      name={name}
      disabled={disabled}
      invalid={invalid}
    >
      <Fieldset.Root className="choice-group__group rating__group">
        {label !== undefined && (
          <Fieldset.Legend className="field-label rating__label">
            <span className="rating__label-text" id={labelTextId}>
              {label}
            </span>
            {readOnly && !disabled && <ReadOnlyNote />}
          </Fieldset.Legend>
        )}
        {description && <Field.Description className="field-description rating__description">{description}</Field.Description>}
        {error && (
          <FieldError className="rating__error" match={invalid}>
            {error}
          </FieldError>
        )}
        <div className="rating__row">
          <BaseRadioGroup<number | null>
            {...rest}
            ref={setGroupRef}
            className="rating__stars"
            value={shown}
            onValueChange={handleValueChange}
            required={required}
            readOnly={readOnly}
            form={form}
          >
            {stars.map((star) => (
              <Field.Item key={star} className="rating__item">
                {/* A span, as in Radio, not a native button: a disabled button can't take focus, and Base UI makes
                    the chosen star the group's one Tab stop */}
                <BaseRadio.Root
                  className="rating__star"
                  value={star}
                  aria-label={star === 1 ? "1 star" : `${star} stars`}
                >
                  <StarIcon />
                </BaseRadio.Root>
              </Field.Item>
            ))}
          </BaseRadioGroup>
          {showClear && (
            <BaseButton
              className="inset-button rating__clear"
              onClick={clear}
              onFocus={() => {
                clearHadFocus.current = true;
              }}
              onBlur={() => {
                clearHadFocus.current = false;
              }}
              {...clearName}
            >
              {!ariaLabel && (
                <span className="visually-hidden" id={clearTextId}>
                  Clear rating,
                </span>
              )}
              <ClearIcon />
            </BaseButton>
          )}
        </div>
      </Fieldset.Root>
    </Field.Root>
  );
}

/** Lucide's star, twice: a fill underneath, shown when the star is filled, and the outline on top. Colors and line width come from the CSS. */
function StarIcon() {
  return (
    <svg className="rating__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path className="rating__fill" d={starPath} />
      <path className="rating__outline" d={starPath} />
    </svg>
  );
}

/** Lucide's X. Its line width comes from the CSS. */
function ClearIcon() {
  return (
    <svg
      className="inset-button__icon rating__clear-icon"
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
