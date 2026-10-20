import type { ReactNode } from "react";

/* Pieces Button and ButtonLink have in common. Not exported from the package. */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface SharedProps {
  /** Visual weight. Use `primary` for the one main action in a view. Default: `primary`. */
  variant?: ButtonVariant;
  /** Height and type size. Small buttons still get a 44px hit area. Default: `md`. */
  size?: ButtonSize;
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

export { cx } from "../../internal/cx";

function Spinner() {
  return (
    <svg className="button__spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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
