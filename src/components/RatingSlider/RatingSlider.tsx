import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Field } from "@base-ui/react/field";
import { Slider } from "@base-ui/react/slider";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode, Ref } from "react";
import { cx } from "@/internal/cx";
import { ratingColor } from "@/internal/ratingColor";
import type { RatingColor } from "@/internal/ratingColor";
import { FieldError } from "@/internal/FieldError";
import { ReadOnlyNote } from "@/internal/ReadOnlyNote";
import { starPath } from "@/internal/star";
import { useMergedRef } from "@/internal/useMergedRef";
import { useResettableValue } from "@/internal/useResettableValue";
import { warn, warnIfUnnamed } from "@/internal/warn";

/** How finely a RatingSlider moves: whole, half, or quarter stars. */
export type RatingSliderStep = 1 | 0.5 | 0.25;

/** A rating slider needs a name a screen reader can announce: a visible label, or an `aria-label`. */
type Labelled =
  | {
      /** The visible label above the stars, naming what's being rated. Required unless `aria-label` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the slider for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The visible label above the stars, naming what's being rated. Required unless `aria-label` is set. */
      label?: undefined;
      /** Names the slider for screen readers when there's no visible label. Required without `label`. */
      "aria-label": string;
    };

interface OwnProps {
  /** How many stars there are. Keep to 3 to 10, and to 5 or fewer on pages used on phones. Default: `5`. */
  max?: number;
  /** How finely it moves: `1` for whole stars, `0.5` for halves, `0.25` for quarters. Default: `0.5`. */
  step?: RatingSliderStep;
  /** The rating, or `null` (or `0`) for none. Use with `onValueChange` to control it. */
  value?: number | null;
  /** The rating at the start, when you don't control it. Leave it out, or use `0`, for none. */
  defaultValue?: number;
  /**
   * Called on every change, while dragging too, with the rating, or `null` when it's taken back to none. Calling
   * `eventDetails.cancel()` keeps the rating as it was.
   */
  onValueChange?: (value: number | null, eventDetails: Slider.Root.ChangeEventDetails) => void;
  /** Called once a change is finished: when a drag ends, or after a key press. For saving the rating. */
  onValueCommitted?: (value: number | null, eventDetails: Slider.Root.CommitEventDetails) => void;
  /** Identifies the field when the form is submitted. The rating is sent as a number, and `0` for none. */
  name?: string;
  /** Shows the rating in words beside the stars ("3.5 of 5"). Turn it off only where the stars are whole and space is tight. Default: `true`. */
  showValue?: boolean;
  /**
   * Shows the slashed circle left of the stars: a star-wide place to click or drag to for no rating. It's a drawing,
   * not a button. Turn it off for just the stars: a sliver left of the first star (half a step wide) still means no
   * rating, and so does dragging past the left edge, Home, or the left arrow. Default: `true`.
   */
  showClear?: boolean;
  /** Help text between the label and the stars, read before choosing. Linked to the slider. */
  description?: ReactNode;
  /** The message shown between the description and the stars when `invalid` is true, with an icon. Linked to the slider. */
  error?: ReactNode;
  /** Marks the slider as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks all interaction. A disabled slider can't be reached with Tab and isn't submitted. */
  disabled?: boolean;
  /**
   * Keeps the slider focusable, readable, and submitted, but blocks every change. Shows "Read only" beside the label.
   * Nothing else looks different.
   */
  readOnly?: boolean;
  /** The id of a `<form>` to submit with, when the slider sits outside that form. */
  form?: string;
  /** The range input's id, so a link to `#id` or a `<label for>` reaches the focusable element. */
  id?: string;
  /** More ids of elements that describe the slider, read after its own description and error. */
  "aria-describedby"?: string;
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
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the range input, the one focusable element. */
  ref?: Ref<HTMLInputElement>;
}

export type RatingSliderProps = Labelled &
  OwnProps &
  Omit<
    Slider.Root.Props,
    | "className"
    | "render"
    | "children"
    | "aria-label"
    | "min"
    | "largeStep"
    | "orientation"
    | "thumbAlignment"
    | "format"
    | "locale"
    | "minStepsBetweenValues"
    | "thumbCollisionBehavior"
    | "tabIndex"
    | keyof OwnProps
  >;

/**
 * A row of stars that works as a slider: drag across it, click anywhere on it, or use the arrow keys, and the stars
 * fill to the rating, in whole, half, or quarter stars. Dragging (or pressing Home) to the far left is no rating,
 * marked by a slashed circle unless `showClear` is off. With
 * a mouse, hovering fills the stars a click would choose. Built on Base UI's Slider and Field, so screen readers
 * announce one slider ("Interest, slider, 3.5 stars"), the label, description, and error are linked to it, and it
 * takes part in forms. For whole stars with a Clear button, use a Rating.
 */
export function RatingSlider({
  label,
  description,
  error,
  invalid,
  disabled,
  readOnly,
  name,
  form,
  id,
  max = 5,
  step = 0.5,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  showValue = true,
  showClear = true,
  className,
  color,
  ref,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  ...rest
}: RatingSliderProps) {
  warnIfUnnamed("RatingSlider", label, { ...rest, "aria-label": ariaLabel }, "Give it a label or an aria-label.");
  const starColor = ratingColor("RatingSlider", color);

  // A max that can't be counted would leave no stars, so it falls back to the default
  const maxIsValid = Number.isInteger(max) && max >= 1;
  if (!maxIsValid) warn("RatingSlider", `max must be a whole number of 1 or more, like 5. Got ${max}.`);
  const count = maxIsValid ? max : 5;

  // The slider always gets its value from here, so a form reset can put it back (Base UI's slider keeps its value
  // through a reset). 0 and null both mean no rating; it's kept as null.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { controlled, shown, setOwnValue } = useResettableValue({
    value: value === undefined ? undefined : value || null,
    defaultValue: defaultValue || undefined,
    groupRef: wrapperRef,
    form,
  });

  // A value between steps or past the last star is snapped, so the stars, what screen readers hear, and what the form
  // sends all agree. The page's own value then differs from what shows, which nothing on the page reveals, so it warns.
  const snap = (number: number) => Math.min(Math.max(Math.round(number / step) * step, 0), count);
  const raw = shown ?? 0;
  const current = snap(raw);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  if (Math.abs(current - raw) > 1e-9) {
    const range = `Use ${step === 1 ? "a whole number" : `a multiple of ${step}`} from 0 to ${count}`;
    if (controlled) warn("RatingSlider", `The value ${raw} isn't one of the steps. ${range}, or null for none.`);
    else if (!mounted.current) warn("RatingSlider", `The defaultValue ${raw} isn't one of the steps. ${range}, or leave it out for none.`);
    else warn("RatingSlider", `The value ${raw} isn't one of the steps. ${range}, or clear it.`);
  }

  // The hover preview: with a mouse or pen, the stars fill to the value under the pointer, worked out the way Base UI
  // works out a press (the control's content box, rounded to the step). Off while a button is held (a drag shows the
  // real value), after a key press until the pointer moves again, and while disabled or read-only.
  const [preview, setPreview] = useState<number | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const control = controlRef.current;
    if (!control || disabled || readOnly || event.pointerType === "touch" || event.buttons !== 0) return;
    const box = control.getBoundingClientRect();
    const style = getComputedStyle(control);
    const start = parseFloat(style.paddingInlineStart) + parseFloat(style.borderInlineStartWidth);
    const end = parseFloat(style.paddingInlineEnd) + parseFloat(style.borderInlineEndWidth);
    const size = box.width - start - end;
    if (size <= 0) return;
    setPreview(snap(Math.min(Math.max((event.clientX - box.left - start) / size, 0), 1) * count));
  };
  // A preview left over when the slider turns disabled or read-only under a resting pointer never shows
  const drawn = disabled || readOnly ? current : (preview ?? current);

  const handleValueChange = (next: number | number[], eventDetails: Slider.Root.ChangeEventDetails) => {
    // Read-only: Base UI has no read-only state, so every change is cancelled, which also stops it being committed
    if (readOnly) {
      eventDetails.cancel();
      return;
    }
    const number = Array.isArray(next) ? next[0]! : next;
    onValueChange?.(number || null, eventDetails);
    if (!controlled && !eventDetails.isCanceled) setOwnValue(number || null);
  };
  const handleValueCommitted = (next: number | number[], eventDetails: Slider.Root.CommitEventDetails) => {
    if (readOnly) return;
    const number = Array.isArray(next) ? next[0]! : next;
    onValueCommitted?.(number || null, eventDetails);
  };

  // The input: Base UI passes only a few props to it, so the consumer's id and aria-readonly are set on it directly.
  // Base UI's label finds the input by the id it gave it, so the label focuses the input itself (below).
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useMergedRef(inputRef, ref);
  const baseId = useRef<string | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (baseId.current === null) baseId.current = input.id;
    input.id = id ?? baseId.current;
    if (readOnly) input.setAttribute("aria-readonly", "true");
    else input.removeAttribute("aria-readonly");
  }, [id, readOnly]);
  const focusFromLabel = (event: MouseEvent<HTMLLabelElement>) => {
    if (event.target instanceof Element && event.target.closest("a, button, input, select, textarea")) return;
    inputRef.current?.focus({ focusVisible: true } as FocusOptions);
  };

  const stars = Array.from({ length: count }, (_, index) => index + 1);

  return (
    <Field.Root
      ref={wrapperRef}
      className={cx("choice-group", "rating-slider", className)}
      disabled={disabled}
      invalid={invalid}
      data-color={starColor["data-color"]}
      data-clear={showClear || undefined}
      style={{ ...starColor.style, "--rating-slider-step": step, "--rating-slider-max": count } as CSSProperties}
    >
      {/* Locked left to right, both the drawing (dir) and Base UI's pointer math and keys (DirectionProvider): a
          right-to-left page would otherwise get stars filling from the left and presses measured from the right */}
      <DirectionProvider direction="ltr">
        <Slider.Root
          {...rest}
          className="choice-group__group rating-slider__root"
          value={current}
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
          min={0}
          max={count}
          step={step}
          largeStep={1}
          name={name}
          form={form}
        >
          {label !== undefined && (
            <Field.Label nativeLabel={false} render={<div />} className="field-label rating-slider__label" onClick={focusFromLabel}>
              {label}
              {readOnly && !disabled && <ReadOnlyNote />}
            </Field.Label>
          )}
          {description && <Field.Description className="field-description rating-slider__description">{description}</Field.Description>}
          {error && (
            <FieldError className="rating-slider__error" match={invalid}>
              {error}
            </FieldError>
          )}
          <div className="rating-slider__row">
            <div className="rating-slider__frame" dir="ltr">
              <Slider.Control
                ref={controlRef}
                className="rating-slider__control"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setPreview(null)}
                onPointerDown={() => setPreview(null)}
              >
                {/* The no-rating strip and the stars are drawing only: the thumb's input holds the value */}
                {showClear && (
                  <span className="rating-slider__zero" aria-hidden="true" data-active={drawn === 0 || undefined}>
                    <BanIcon />
                  </span>
                )}
                <span className="rating-slider__stars" aria-hidden="true">
                  {stars.map((star) => (
                    <span
                      key={star}
                      className="rating-slider__star"
                      style={{ "--rating-slider-fill": Math.min(Math.max(drawn - (star - 1), 0), 1) } as CSSProperties}
                    >
                      <StarIcon className="rating-slider__outline" />
                      <span className="rating-slider__fill">
                        <StarIcon className="rating-slider__solid" />
                      </span>
                    </span>
                  ))}
                </span>
                <Slider.Track className="rating-slider__track">
                  <Slider.Thumb
                    className="rating-slider__thumb"
                    inputRef={setInputRef}
                    aria-label={ariaLabel}
                    aria-describedby={ariaDescribedBy}
                    getAriaValueText={(_formatted, number) => describeStars(number)}
                    onKeyDown={() => setPreview(null)}
                  />
                </Slider.Track>
              </Slider.Control>
            </div>
            {showValue && (
              // The words keep the width of the longest they can show, so the stars never move when they change: in a
              // centered row they would otherwise shift under the pointer in the middle of a drag
              <span className="rating-slider__value" aria-hidden="true">
                <span className="rating-slider__value-text">{drawn === 0 ? "No rating" : `${drawn} of ${count}`}</span>
                <span className="rating-slider__value-sizer">No rating</span>
                <span className="rating-slider__value-sizer">{`${count - step} of ${count}`}</span>
              </span>
            )}
          </div>
        </Slider.Root>
      </DirectionProvider>
    </Field.Root>
  );
}

/** What screen readers hear for a value: "No rating", "1 star", "3.5 stars" */
function describeStars(value: number) {
  if (value === 0) return "No rating";
  return value === 1 ? "1 star" : `${value} stars`;
}

/** Lucide's star, with the view box cropped to the star, so half the box is half the star. Colors and lines come from the CSS. */
function StarIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="2.15 2 19.7 19.7" focusable="false">
      <path d={starPath} />
    </svg>
  );
}

/** Lucide's ban icon, a slashed circle, in the no-rating strip. Its line width comes from the CSS. */
function BanIcon() {
  return (
    <svg className="rating-slider__zero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.929 4.929 19.07 19.071" />
    </svg>
  );
}
