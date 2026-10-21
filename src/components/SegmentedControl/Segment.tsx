import { Field } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import type { ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { warnIfUnnamed } from "../../internal/warn";

type Label = Exclude<ReactNode, undefined | null | boolean>;

/** A segment needs a name a screen reader can announce: label text, or an `aria-label` when it shows only an icon. */
type Labelled =
  | {
      /** Shows only the icon passed as `children`, with no visible label. Requires an `aria-label`. Default: `false`. */
      iconOnly?: false;
      /** The label text. Required. */
      children: Label;
      /** Names the option for screen readers. Usually not needed, because the label text names it already. */
      "aria-label"?: string;
    }
  | {
      /** Shows only the icon passed as `children`, with no visible label. Requires an `aria-label`. Default: `false`. */
      iconOnly: true;
      /** The icon. Decorative: it is hidden from screen readers, so `aria-label` names the option. */
      children: Label;
      /**
       * Names the icon-only option for screen readers ("Grid view"). Required with `iconOnly`. Sighted people only
       * see the icon, so use one whose meaning is obvious, or show label text instead.
       */
      "aria-label": string;
    };

interface OwnProps {
  /** What the control's value becomes, and what the form submits, when this option is chosen. Unique within its control. */
  value: string;
  /** Icon shown before the label. Decorative: it is hidden from screen readers. */
  iconStart?: ReactNode;
  /** Icon shown after the label. Decorative: it is hidden from screen readers. */
  iconEnd?: ReactNode;
  /** Blocks this option only: it can't be chosen, and the arrow keys skip it. Disable them all on the SegmentedControl. */
  disabled?: boolean;
  /** Applied to the option's wrapper, so it's the place for layout classes. */
  className?: string;
  /** Reaches the focusable option element. */
  ref?: Ref<HTMLElement>;
}

export type SegmentProps = Labelled &
  OwnProps &
  Omit<
    BaseRadio.Root.Props,
    | "className"
    | "render"
    | "nativeButton"
    | "children"
    | "aria-label"
    | "required"
    | "readOnly"
    | "id"
    | "inputRef"
    | keyof OwnProps
  >;

/**
 * One option in a SegmentedControl, drawn as a button with label text, icons, or both. The chosen option is filled, and its
 * label and icons turn bold. Only works inside a SegmentedControl, which owns the name, the chosen value, the size,
 * and whether the options are required, invalid, or read-only.
 */
export function Segment({ children, iconOnly = false, iconStart, iconEnd, disabled, className, ...rest }: SegmentProps) {
  warnIfUnnamed(
    "Segment",
    iconOnly ? undefined : children,
    rest,
    iconOnly ? "Give an icon-only option an aria-label that says what it shows." : "Give it label text (children) or an aria-label.",
  );

  return (
    <Field.Item className={cx("segment", className)} disabled={disabled}>
      {/* A span, as in Radio, not a native button: a disabled button can't take focus, and Base UI makes the chosen
          option the control's one Tab stop, so a chosen, disabled option would hide the whole control from Tab */}
      <BaseRadio.Root {...rest} className="segment__button" data-icon-only={iconOnly || undefined}>
        {iconOnly ? (
          <span className="segment__icon" aria-hidden="true">
            {children}
          </span>
        ) : (
          <>
            {iconStart && (
              <span className="segment__icon" aria-hidden="true">
                {iconStart}
              </span>
            )}
            {/* The hidden bold copy sits in the same place and sets the width, so the control doesn't shift
                when this option turns bold */}
            <span className="segment__label">
              <span className="segment__text">{children}</span>
              <span className="segment__sizer" aria-hidden="true">
                {children}
              </span>
            </span>
            {iconEnd && (
              <span className="segment__icon" aria-hidden="true">
                {iconEnd}
              </span>
            )}
          </>
        )}
      </BaseRadio.Root>
    </Field.Item>
  );
}
