import { Button as BaseButton } from "@base-ui/react/button";
import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface SharedProps {
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
type IconOnly =
  | { iconOnly?: false; "aria-label"?: string }
  | { iconOnly: true; "aria-label": string };

export type ButtonProps = SharedProps &
  IconOnly &
  Omit<BaseButton.Props, "className" | "render" | "nativeButton" | keyof SharedProps | "aria-label"> & {
    /** Shows a spinner and blocks clicks, but keeps the button focusable so keyboard users don't lose their place. */
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function Spinner() {
  return (
    <svg className="button__spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Content({ iconStart, iconEnd, iconOnly, loading, children }: {
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

/**
 * Triggers an action. For navigation, use `ButtonLink`, which renders a real `<a>`.
 * Built on Base UI's Button for consistent keyboard and disabled behavior.
 */
export function Button({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  iconOnly = false,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      {...rest}
      className={cx("button", className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
    >
      <Content iconStart={iconStart} iconEnd={iconEnd} iconOnly={iconOnly} loading={loading}>
        {children}
      </Content>
    </BaseButton>
  );
}

export type ButtonLinkProps = SharedProps &
  IconOnly &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | keyof SharedProps | "aria-label"> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

/**
 * A link that looks like a button. Renders a real `<a>`, so it navigates, opens in a
 * new tab, and is announced as a link. Links can't be disabled; remove it instead.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  iconOnly = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a
      {...rest}
      className={cx("button", className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
    >
      <Content iconStart={iconStart} iconEnd={iconEnd} iconOnly={iconOnly}>
        {children}
      </Content>
    </a>
  );
}
