import type { ReactNode } from "react";
import { SpinnerGraphic } from "@/internal/SpinnerGraphic";

/* Pieces Button and ButtonLink have in common. Not exported from the package. */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "rectangle" | "pill";
export type ButtonTone = "neutral" | "danger";

export interface SharedProps {
  /** Visual weight. Use `primary` for the one main action in a view. Default: `primary`. */
  variant?: ButtonVariant;
  /** Height and type size. Small buttons still get a target-min hit area (44px on touch). Default: `md`. */
  size?: ButtonSize;
  /** Corners. `rectangle` has four straight edges and slightly rounded corners; `pill` is fully rounded. Default: `rectangle`. */
  shape?: ButtonShape;
  /** Icon shown before the label. Decorative: it is hidden from screen readers. */
  iconStart?: ReactNode;
  /** Icon shown after the label. Decorative: it is hidden from screen readers. */
  iconEnd?: ReactNode;
  className?: string;
}

/** An icon-only button must have an accessible name. */
export type IconOnly =
  | {
      /** Shows only the icon, with no visible label. Requires an `aria-label`. Default: `false`. */
      iconOnly?: false;
      /** Names the button for screen readers. Usually not needed when the button has label text. */
      "aria-label"?: string;
    }
  | {
      /** Shows only the icon, with no visible label. Requires an `aria-label`. Default: `false`. */
      iconOnly: true;
      /** Names the icon-only button for screen readers, saying what it does ("Close dialog"). Required with `iconOnly`. */
      "aria-label": string;
    };

export { cx } from "@/internal/cx";

/** The drawing a loading button shows in place of its start icon, shared with Spinner. */
const Spinner = () => <SpinnerGraphic className="button__spinner" />;

export function Content({ iconStart, iconEnd, iconOnly, loading, children }: {
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  children?: ReactNode;
}) {
  if (iconOnly) {
    return <span className="button__icon" aria-hidden="true">{loading ? <Spinner /> : children}</span>;
  }
  return (
    <>
      {loading ? (
        <span className="button__icon" aria-hidden="true"><Spinner /></span>
      ) : (
        iconStart && <span className="button__icon" aria-hidden="true">{iconStart}</span>
      )}
      <span className="button__label">{children}</span>
      {iconEnd && <span className="button__icon" aria-hidden="true">{iconEnd}</span>}
    </>
  );
}
