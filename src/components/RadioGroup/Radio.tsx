import { Field } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import type { ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { warnIfUnnamed } from "../../internal/warn";

/** A radio needs a name a screen reader can announce: visible label text, or an `aria-label`. */
type Labelled =
  | {
      /** The label text beside the circle. The whole row is the click target. Required unless `aria-label` is set. */
      children: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the radio for screen readers. Usually not needed when there is label text, which names it already. */
      "aria-label"?: string;
    }
  | {
      /** The label text beside the circle. The whole row is the click target. Required unless `aria-label` is set. */
      children?: undefined;
      /** Names the radio for screen readers when there's no visible label, such as a row in a table. Required without `children`. */
      "aria-label": string;
    };

interface OwnProps {
  /** What the group's value becomes, and what the form submits, when this radio is selected. Unique within its group. */
  value: string;
  /** Secondary text under the label. Linked to the radio, after the group's own description. */
  description?: ReactNode;
  /** Blocks this radio only: it can't be chosen, and the arrow keys skip it. Disable the whole group on the RadioGroup. */
  disabled?: boolean;
  /**
   * The id of the hidden `<input>`, not of the visible radio. A `<label htmlFor>` pointing at it selects the
   * radio but doesn't give it a name screen readers announce, so label it with `children` or `aria-label` instead.
   */
  id?: string;
  /** Applied to the radio's wrapper, so it's the place for layout classes such as margin. */
  className?: string;
  /** Reaches the focusable radio element. */
  ref?: Ref<HTMLElement>;
  /** Reaches the hidden `<input>` that takes part in the form. */
  inputRef?: Ref<HTMLInputElement>;
}

export type RadioProps = Labelled &
  OwnProps &
  Omit<
    BaseRadio.Root.Props,
    "className" | "render" | "nativeButton" | "children" | "aria-label" | "required" | "readOnly" | keyof OwnProps
  >;

/**
 * One option in a RadioGroup: a circle that shows a dot when selected, with its label. Only works inside a
 * RadioGroup, which owns the name, the selected value, and whether the options are required, invalid, or read-only.
 * Clicking the label text selects it.
 */
export function Radio({ children, description, disabled, className, ...rest }: RadioProps) {
  warnIfUnnamed("Radio", children, rest, "Give it label text (children) or an aria-label.");

  const circle = (
    <BaseRadio.Root {...rest} className="choice__control radio__circle">
      <BaseRadio.Indicator className="choice__indicator radio__indicator">
        <svg className="radio__dot" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="4" fill="currentColor" />
        </svg>
      </BaseRadio.Indicator>
    </BaseRadio.Root>
  );

  return (
    <Field.Item className={cx("choice", "radio", className)} disabled={disabled}>
      {children === undefined ? (
        circle
      ) : (
        <Field.Label className="choice__row radio__row">
          {circle}
          <span className="choice__label radio__label">{children}</span>
        </Field.Label>
      )}
      {description && <Field.Description className="field-description radio__description">{description}</Field.Description>}
    </Field.Item>
  );
}
